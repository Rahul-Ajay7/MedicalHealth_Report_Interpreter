import os
from typing import List
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import pdfplumber
import cv2
import numpy as np

TESSERACT_CMD = os.getenv("TESSERACT_CMD")
POPPLER_PATH = os.getenv("POPPLER_PATH")


# ---------------- SET TESSERACT ----------------
def _set_tesseract_path():
    if TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


# ---------------- IMAGE PREPROCESS ----------------
def _preprocess_image(pil_img: Image.Image) -> Image.Image:
    img = np.array(pil_img)

    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    # improve contrast
    img = cv2.convertScaleAbs(img, alpha=1.7, beta=10)

    # noise remove
    img = cv2.medianBlur(img, 3)

    # threshold
    img = cv2.adaptiveThreshold(
        img, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 2
    )

    return Image.fromarray(img)


# ---------------- OCR IMAGE ----------------
def _ocr_image(pil_img: Image.Image) -> str:
    _set_tesseract_path()
    processed = _preprocess_image(pil_img)

    custom_config = r'--oem 3 --psm 6'
    text = pytesseract.image_to_string(processed, lang="eng", config=custom_config)

    return text


# ---------------- TABLE EXTRACTION ----------------
def _extract_tables_from_pdf(pdf_path: str) -> str:
    """
    Extract tables using pdfplumber (best for lab reports)
    """
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


# ---------------- DIGITAL TEXT ----------------
def _extract_text_from_digital_pdf(pdf_path: str) -> str:
    texts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                texts.append(txt)

    return "\n".join(texts)


# ---------------- OCR FULL PDF ----------------
def _ocr_pdf(pdf_path: str) -> str:
    pages: List[Image.Image] = convert_from_path(
        pdf_path,
        dpi=300,
        poppler_path=POPPLER_PATH
    )

    all_text = []

    for i, page in enumerate(pages):
        print(f"🔍 OCR processing page {i+1}...")
        page_text = _ocr_image(page)
        all_text.append(page_text)

    return "\n".join(all_text)


# ---------------- MAIN UNIVERSAL FUNCTION ----------------
def extract_text_from_file(file_path: str) -> str:

    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path)

    ext = os.path.splitext(file_path)[1].lower()

    final_text_parts = []

    # -------- PDF HANDLING --------
    if ext == ".pdf":
        print("📄 Processing PDF:", file_path)

        # 1️⃣ TABLE extraction
        try:
            table_text = _extract_tables_from_pdf(file_path)
            if table_text.strip():
                print("✅ Tables extracted")
                final_text_parts.append("\n---TABLE DATA---\n" + table_text)
        except Exception as e:
            print("⚠ Table extraction failed:", e)

        # 2️⃣ Digital text
        try:
            digital_text = _extract_text_from_digital_pdf(file_path)
            if digital_text.strip():
                print("✅ Digital text extracted")
                final_text_parts.append("\n---DIGITAL TEXT---\n" + digital_text)
        except Exception as e:
            print("⚠ Digital text failed:", e)

        # 3️⃣ OCR (always run — IMPORTANT)
        try:
            print("🧠 Running OCR on full PDF...")
            ocr_text = _ocr_pdf(file_path)
            if ocr_text.strip():
                final_text_parts.append("\n---OCR TEXT---\n" + ocr_text)
        except Exception as e:
            print("❌ OCR failed:", e)

    # -------- IMAGE HANDLING --------
    elif ext in [".png", ".jpg", ".jpeg"]:
        print("🖼 Processing image:", file_path)
        img_text = _ocr_image(Image.open(file_path))
        final_text_parts.append(img_text)

    else:
        raise ValueError("Unsupported file type")

    final_text = "\n".join(final_text_parts)

    # ---------------- PRINT OCR TEXT IN TERMINAL ----------------
    print("\n================ OCR OUTPUT START ================\n")
    print(final_text)
    print("\n================ OCR OUTPUT END ==================\n")

    return final_text
