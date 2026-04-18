# Use official Python lightweight image
FROM python:3.11-slim

# Maintainer/Metadata
LABEL maintainer="Versona Architects"
LABEL description="Production FastAPI container for Versona"

# Set environment variables
# 1. Prevents Python from burying stdout/stderr
# 2. Prevents Python from generating .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# These are occasionally required by libraries like pdfplumber or spacy
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn uvicorn sentry-sdk

# Copy project files into container
COPY . .

# Expose the standard Render port
EXPOSE 8000

# Create a non-root user for extreme security
RUN adduser --disabled-password --gecos "" fastapi-user
RUN chown -R fastapi-user /app
USER fastapi-user

# Execute Gunicorn using our configuration file and the Uvicorn worker class
CMD ["gunicorn", "--config", "gunicorn_conf.py", "master_main:app"]
