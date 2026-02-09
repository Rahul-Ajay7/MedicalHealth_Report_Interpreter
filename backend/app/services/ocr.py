import os
from typing import List
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import pdfplumber
import cv2
import numpy as np

# -----------------------------
# CONFIG (Environment-based)
# -----------------------------
TESSERACT_CMD = os.getenv("TESSERACT_CMD")     # e.g. /usr/bin/tesseract
POPPLER_PATH = os.getenv("POPPLER_PATH")       # e.g. /usr/bin


def _set_tesseract_path():
    """
    Ensure pytesseract knows where tesseract executable is.
    If not set, system PATH will be used.
    """
    if TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


def _preprocess_image(pil_img: Image.Image) -> Image.Image:
    """
    Improve OCR accuracy:
    - grayscale
    - denoise
    - adaptive threshold
    """
    img = np.array(pil_img)

    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    img = cv2.GaussianBlur(img, (3, 3), 0)

    img = cv2.adaptiveThreshold(
        img,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        2
    )

    return Image.fromarray(img)


def _ocr_image(pil_img: Image.Image) -> str:
    _set_tesseract_path()
    processed = _preprocess_image(pil_img)
    config = "--oem 3 --psm 6"
    text = pytesseract.image_to_string(processed, lang="eng", config=config)
    return text.strip()


def _extract_text_from_digital_pdf(pdf_path: str) -> str:
    """
    Extract selectable text from digital PDFs (fast).
    """
    texts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            texts.append(page.extract_text() or "")
    return "\n".join(texts).strip()


def _ocr_pdf(pdf_path: str) -> str:
    """
    Convert PDF pages to images, then OCR.
    """
    pages: List[Image.Image] = convert_from_path(
        pdf_path,
        dpi=300,
        poppler_path=POPPLER_PATH
    )

    all_text = []
    for idx, page in enumerate(pages, start=1):
        page_text = _ocr_image(page)
        all_text.append(f"\n--- PAGE {idx} ---\n{page_text}")

    return "\n".join(all_text).strip()


def extract_text_from_file(file_path: str) -> str:
    """
    Main OCR entrypoint.
    Supports PDF and image files.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        digital_text = _extract_text_from_digital_pdf(file_path)

        # If PDF contains real text, skip OCR
        if digital_text and len(digital_text) > 30:
            return digital_text

        return _ocr_pdf(file_path)

    if ext in [".png", ".jpg", ".jpeg"]:
        return _ocr_image(Image.open(file_path))

    raise ValueError(f"Unsupported file type: {ext}")
