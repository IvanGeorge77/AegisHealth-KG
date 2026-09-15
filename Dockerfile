# Use Python 3.13 slim image
FROM python:3.11-slim
# Set working directory
WORKDIR /app
# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*
# Copy the entire project first
COPY . .

# Install the project and its dependencies in editable mode
RUN pip install --no-cache-dir -e .
# Expose the API port
EXPOSE 8000
# Run the FastAPI app
CMD ["uvicorn", "aegis.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]