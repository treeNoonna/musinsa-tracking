FROM mcr.microsoft.com/playwright/python:v1.52.0-jammy

WORKDIR /app

COPY backend/scraper-worker/requirements.txt /app/backend/scraper-worker/requirements.txt
RUN python3.11 -m pip install --no-cache-dir -r /app/backend/scraper-worker/requirements.txt

COPY . /app

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "python3.11 -m uvicorn app:app --app-dir /app/backend/scraper-worker --host 0.0.0.0 --port ${PORT:-8080}"]
