FROM python:3.11-slim

# Install Tesseract and Poppler automatically
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Shell form so $PORT (injected by Render) expands. No --reload in production.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}