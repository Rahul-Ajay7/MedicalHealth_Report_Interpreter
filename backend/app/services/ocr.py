"""
ocr.py  —  HealthAI upgraded OCR service
=========================================
Priority chain:
  1. Claude Vision  (best accuracy, handles skewed/handwritten/complex layouts)
  2. pdfplumber tables + digital text  (fast, free, great for digital PDFs)
  3. pytesseract fallback  (last resort for scanned images)

Add to .env:
  ANTHROPIC_API_KEY=sk-ant-...
  CLAUDE_VISION_MODEL=claude-opus-4-5   # or claude-sonnet-4-6 for speed
"""

import os
import base64
import re
import logging
from typing import List
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import pdfplumber
import cv2
import numpy as np
import requests

logger = logging.getLogger(__name__)

# ── Env vars ──────────────────────────────────────────────────────────────────
TESSERACT_CMD       = os.getenv("TESSERACT_CMD")
POPPLER_PATH        = os.getenv("POPPLER_PATH")
ANTHROPIC_API_KEY   = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_VISION_MODEL = os.getenv("CLAUDE_VISION_MODEL", "claude-sonnet-4-6")
PDF_DPI             = int(os.getenv("PDF_DPI", 200))   # 200 good balance speed/quality

CLAUDE_VISION_PROMPT = """You are a medical OCR specialist. Extract ALL text from this lab report image with perfect accuracy.

Rules:
- Preserve numbers exactly (15.0 not 15, 4.7-6.1 not 4.7 to 6.1)
- Preserve units exactly (g/dL, cells/mcL, mIU/L, %, mg/dL)
- Preserve reference ranges exactly (e.g. 13-17, 4.0-11.0)
- Output table rows as: PARAMETER | VALUE | UNIT | REFERENCE_RANGE | STATUS
- Include ALL parameters even if status is normal
- Do not interpret, summarize, or add information not visible in the image
- Output raw extracted text only"""


# ── Tesseract path ─────────────────────────────────────────────────────────────
def _set_tesseract_path():
    if TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


# ── Image preprocessing for pytesseract fallback ──────────────────────────────
def _preprocess_image(pil_img: Image.Image) -> Image.Image:
    img = np.array(pil_img)
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    # Deskew
    coords = np.column_stack(np.where(img < 200))
    if len(coords) > 100:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) > 0.5:
            (h, w) = img.shape[:2]
            M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
            img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC,
                                  borderMode=cv2.BORDER_REPLICATE)

    # Enhance contrast
    img = cv2.convertScaleAbs(img, alpha=1.7, beta=10)
    img = cv2.medianBlur(img, 3)
    img = cv2.adaptiveThreshold(
        img, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 2
    )
    return Image.fromarray(img)


# ── pytesseract OCR (fallback) ─────────────────────────────────────────────────
def _ocr_image_tesseract(pil_img: Image.Image) -> str:
    _set_tesseract_path()
    processed = _preprocess_image(pil_img)
    config = r'--oem 3 --psm 6 -c preserve_interword_spaces=1'
    return pytesseract.image_to_string(processed, lang="eng", config=config)


# ── Claude Vision OCR (primary) ───────────────────────────────────────────────
def _pil_to_base64(pil_img: Image.Image) -> str:
    """Convert PIL image to base64 JPEG string."""
    import io
    buf = io.BytesIO()
    # Upscale small images for better Claude accuracy
    w, h = pil_img.size
    if w < 1000:
        scale = 1000 / w
        pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    pil_img.save(buf, format="JPEG", quality=92)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _ocr_image_claude(pil_img: Image.Image) -> str:
    """Send image to Claude Vision, return extracted text."""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set")

    img_b64 = _pil_to_base64(pil_img)

    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": CLAUDE_VISION_MODEL,
            "max_tokens": 2048,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": img_b64,
                            },
                        },
                        {"type": "text", "text": CLAUDE_VISION_PROMPT},
                    ],
                }
            ],
        },
        timeout=60,
    )
    response.raise_for_status()
    content = response.json().get("content", [])
    return " ".join(block.get("text", "") for block in content if block.get("type") == "text")


# ── Check if PDF is digital (has extractable text) ────────────────────────────
def _pdf_has_digital_text(pdf_path: str, min_chars: int = 100) -> bool:
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                txt = page.extract_text() or ""
                if len(txt.strip()) >= min_chars:
                    return True
    except Exception:
        pass
    return False


# ── pdfplumber extraction ─────────────────────────────────────────────────────
def _extract_tables_from_pdf(pdf_path: str) -> str:
    table_texts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    clean_row = [str(cell).strip() for cell in row if cell]
                    if clean_row:
                        table_texts.append(" | ".join(clean_row))
    return "\n".join(table_texts)


def _extract_digital_text_from_pdf(pdf_path: str) -> str:
    texts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                texts.append(txt)
    return "\n".join(texts)


# ── PDF → Claude Vision pipeline ─────────────────────────────────────────────
def _ocr_pdf_claude(pdf_path: str) -> str:
    pages: List[Image.Image] = convert_from_path(
        pdf_path, dpi=PDF_DPI, poppler_path=POPPLER_PATH
    )
    all_text = []
    for i, page in enumerate(pages):
        logger.info(f"Claude Vision processing page {i+1}/{len(pages)}...")
        try:
            page_text = _ocr_image_claude(page)
            all_text.append(page_text)
        except Exception as e:
            logger.warning(f"Claude Vision failed page {i+1}: {e}. Falling back to tesseract.")
            all_text.append(_ocr_image_tesseract(page))
    return "\n".join(all_text)


# ── PDF → pytesseract pipeline (fallback) ─────────────────────────────────────
def _ocr_pdf_tesseract(pdf_path: str) -> str:
    pages: List[Image.Image] = convert_from_path(
        pdf_path, dpi=300, poppler_path=POPPLER_PATH
    )
    all_text = []
    for i, page in enumerate(pages):
        logger.info(f"Tesseract OCR page {i+1}/{len(pages)}...")
        all_text.append(_ocr_image_tesseract(page))
    return "\n".join(all_text)


# ── MAIN FUNCTION ─────────────────────────────────────────────────────────────
def extract_text_from_file(file_path: str) -> str:
    """
    Universal extractor. Priority per file type:

    PDF (digital):  pdfplumber tables + text  →  no OCR needed (fast, free)
    PDF (scanned):  Claude Vision OCR  →  pytesseract fallback
    Image:          Claude Vision OCR  →  pytesseract fallback
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path)

    ext = os.path.splitext(file_path)[1].lower()
    final_parts = []

    # ── PDF ──────────────────────────────────────────────────────────────────
    if ext == ".pdf":
        logger.info(f"Processing PDF: {file_path}")

        is_digital = _pdf_has_digital_text(file_path)
        logger.info(f"PDF type: {'digital' if is_digital else 'scanned'}")

        if is_digital:
            # Digital PDF — pdfplumber is faster and free
            try:
                table_text = _extract_tables_from_pdf(file_path)
                if table_text.strip():
                    logger.info("Tables extracted via pdfplumber")
                    final_parts.append("\n---TABLE DATA---\n" + table_text)
            except Exception as e:
                logger.warning(f"Table extraction failed: {e}")

            try:
                digital_text = _extract_digital_text_from_pdf(file_path)
                if digital_text.strip():
                    logger.info("Digital text extracted via pdfplumber")
                    final_parts.append("\n---DIGITAL TEXT---\n" + digital_text)
            except Exception as e:
                logger.warning(f"Digital text extraction failed: {e}")

            # Also run Claude Vision on digital PDFs for table structure accuracy
            if ANTHROPIC_API_KEY:
                try:
                    logger.info("Running Claude Vision for table structure verification...")
                    claude_text = _ocr_pdf_claude(file_path)
                    if claude_text.strip():
                        final_parts.append("\n---CLAUDE VISION---\n" + claude_text)
                except Exception as e:
                    logger.warning(f"Claude Vision skipped for digital PDF: {e}")

        else:
            # Scanned PDF — must OCR
            if ANTHROPIC_API_KEY:
                try:
                    logger.info("Running Claude Vision OCR on scanned PDF...")
                    claude_text = _ocr_pdf_claude(file_path)
                    if claude_text.strip():
                        final_parts.append("\n---CLAUDE VISION OCR---\n" + claude_text)
                except Exception as e:
                    logger.warning(f"Claude Vision failed: {e}. Trying tesseract...")
                    ocr_text = _ocr_pdf_tesseract(file_path)
                    if ocr_text.strip():
                        final_parts.append("\n---OCR TEXT---\n" + ocr_text)
            else:
                logger.info("No ANTHROPIC_API_KEY — using tesseract for scanned PDF")
                ocr_text = _ocr_pdf_tesseract(file_path)
                if ocr_text.strip():
                    final_parts.append("\n---OCR TEXT---\n" + ocr_text)

    # ── IMAGE ─────────────────────────────────────────────────────────────────
    elif ext in (".png", ".jpg", ".jpeg"):
        logger.info(f"Processing image: {file_path}")
        pil_img = Image.open(file_path)

        if ANTHROPIC_API_KEY:
            try:
                logger.info("Claude Vision OCR on image...")
                img_text = _ocr_image_claude(pil_img)
                final_parts.append(img_text)
            except Exception as e:
                logger.warning(f"Claude Vision failed: {e}. Falling back to tesseract.")
                final_parts.append(_ocr_image_tesseract(pil_img))
        else:
            final_parts.append(_ocr_image_tesseract(pil_img))

    else:
        raise ValueError(f"Unsupported file type: {ext}")

    final_text = "\n".join(final_parts)

    logger.debug("\n===== OCR OUTPUT =====\n%s\n======================", final_text[:2000])
    return final_text