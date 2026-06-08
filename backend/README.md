# Medical Health Report Interpreter — Backend

FastAPI backend for interpreting medical lab reports using OCR + AI.

## Stack
- Python 3.11, FastAPI, Uvicorn
- Tesseract OCR + pdfplumber
- LLM: Groq (primary) → Gemini Flash → Ollama (fallback)
- Storage: Supabase (auth + DB + file storage)

## Setup

### 1. Clone & create venv
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment variables
SUPABASE_URL
SUPABASE_SERVICE_KEY
GROQ_API_KEY=       # console.groq.com (free)
GEMINI_API_KEY=     # aistudio.google.com (free)

### 3. Run locally
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Run with Docker
```bash
docker-compose up --build
```

## API Routes
| Method | Route | Description |
|--------|-------|-------------|
| POST | /upload/ | Upload report file |
| POST | /analyze/ | OCR + analyze report |
| POST | /chat/ | Chat about report |
| GET | /history/ | Get user report history |
| GET | /report/{id} | Get full report detail |
| DELETE | /history/{id} | Delete report |

## Disclaimer
This tool explains medical terms in plain language.
It is NOT medical advice. Always consult a qualified doctor.