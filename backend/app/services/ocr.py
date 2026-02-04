import os
from typing import List
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import pdfplumber

import cv2
import numpy as np


# -----------------------------
# CONFIG (Update for your PC)
# -----------------------------
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\poppler\poppler-25.12.0\Library\bin"


def _set_tesseract_path():
    """Ensure pytesseract knows where tesseract.exe is."""
    if os.path.exists(TESSERACT_PATH):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def _preprocess_image(pil_img: Image.Image) -> Image.Image:
    """
    Improve OCR accuracy:
    - grayscale
    - denoise
    - threshold
    """
    img = np.array(pil_img)

    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    img = cv2.GaussianBlur(img, (3, 3), 0)

    img = cv2.adaptiveThreshold(
        img, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 2
    )

    return Image.fromarray(img)


def _ocr_image(pil_img: Image.Image) -> str:
    _set_tesseract_path()
    processed = _preprocess_image(pil_img)
    config = r"--oem 3 --psm 6"
    text = pytesseract.image_to_string(processed, lang="eng", config=config)
    return text.strip()


def _extract_text_from_digital_pdf(pdf_path: str) -> str:
    """
    Extract selectable text from PDF (no OCR).
    If PDF is scanned, this will return empty/very small text.
    """
    texts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            texts.append(t)
    return "\n".join(texts).strip()


def _ocr_pdf(pdf_path: str) -> str:
    """Convert PDF pages to images then OCR each page."""
    pages: List[Image.Image] = convert_from_path(
        pdf_path,
        dpi=300,
        poppler_path=POPPLER_PATH if os.path.exists(POPPLER_PATH) else None
    )

    all_text = []
    for idx, page in enumerate(pages, start=1):
        page_text = _ocr_image(page)
        all_text.append(f"\n--- PAGE {idx} ---\n{page_text}")

    return "\n".join(all_text).strip()


def extract_text_from_file(file_path: str) -> str:
    """
    Main OCR entrypoint.
    Supports:
    - PDF
    - PNG/JPG/JPEG
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        # Try digital extraction first
        digital_text = _extract_text_from_digital_pdf(file_path)

        # If digital text exists, use it (fast + accurate)
        if digital_text and len(digital_text) > 30:
            return digital_text

        # Else fallback to OCR
        return _ocr_pdf(file_path)

    if ext in [".png", ".jpg", ".jpeg"]:
        img = Image.open(file_path)
        return _ocr_image(img)

    raise ValueError(f"Unsupported file type: {ext}")
