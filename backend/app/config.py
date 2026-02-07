import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


# ===============================
# APPLICATION
# ===============================
APP_NAME = os.getenv("APP_NAME", "Medical Health Report Interpreter")
APP_ENV = os.getenv("APP_ENV", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"


# ===============================
# SERVER
# ===============================
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))


# ===============================
# FILE UPLOAD
# ===============================
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 10))
ALLOWED_EXTENSIONS = os.getenv(
    "ALLOWED_EXTENSIONS", "pdf,png,jpg,jpeg"
).split(",")

UPLOAD_PATH = BASE_DIR / UPLOAD_DIR
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)


# ===============================
# OCR CONFIGURATION
# ===============================
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
POPPLER_PATH = os.getenv("POPPLER_PATH")

OCR_LANGUAGE = os.getenv("OCR_LANGUAGE", "eng")
OCR_PSM = os.getenv("OCR_PSM", "6")
OCR_OEM = os.getenv("OCR_OEM", "3")
PDF_DPI = int(os.getenv("PDF_DPI", 300))


# ===============================
# DATABASE (PostgreSQL)
# ===============================
DATABASE_URL = os.getenv("DATABASE_URL")


# ===============================
# NLP / AI
# ===============================
NLP_ENGINE = os.getenv("NLP_ENGINE", "rules")   # rules | llama | openai
MAX_EXPLANATION_LENGTH = int(os.getenv("MAX_EXPLANATION_LENGTH", 400))

LLAMA_MODEL_PATH = os.getenv("LLAMA_MODEL_PATH")
LLAMA_MAX_TOKENS = int(os.getenv("LLAMA_MAX_TOKENS", 512))

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# ===============================
# SECURITY
# ===============================
SECRET_KEY = os.getenv("SECRET_KEY", "unsafe-secret")
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000"
).split(",")


# ===============================
# LOGGING
# ===============================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "logs/app.log")
