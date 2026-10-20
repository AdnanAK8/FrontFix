# FrontFix AI — Containerfile (Team B)
# ponytail: Clean multi-layer Python slim container serving API + UI in single process
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy dependency definition
COPY backend/requirements.txt /app/backend/requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend and frontend source
COPY backend /app/backend
COPY frontend /app/frontend

EXPOSE 8000

WORKDIR /app/backend

CMD ["python", "run.py"]
