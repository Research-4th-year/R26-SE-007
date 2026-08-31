# Use the official Python 3.10 slim image as the base image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app


# Copy the requirements file to the working directory
COPY requirements.txt .

# Install the Python dependencies
# Using --no-cache-dir keeps the Docker image smaller
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code and ML models into the container
COPY . .

# Expose the port the FastAPI app will run on
EXPOSE 8000

# Command to run the application using uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
