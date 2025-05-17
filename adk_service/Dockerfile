FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user and set permissions
RUN adduser --disabled-password --gecos "" myuser && \
    chown -R myuser:myuser /app

# Copy the application code
COPY . .

# Switch to non-root user
USER myuser

ENV PATH="/home/myuser/.local/bin:$PATH"

# Expose the port (for documentation, Cloud Run ignores this)
EXPOSE 8001

# Run the server using the PORT environment variable
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"]
