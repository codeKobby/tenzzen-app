FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Create a non-root user for security
RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app

USER appuser

# Set the PATH to include the user's local bin directory
ENV PATH="/home/appuser/.local/bin:$PATH"

# Command to run the server
# Cloud Run will set the PORT environment variable
CMD ["sh", "-c", "python server.py"]
