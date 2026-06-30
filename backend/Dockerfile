# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Create a non-root user that HuggingFace Spaces requires
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container and change ownership
COPY --chown=user ./requirements.txt requirements.txt

# Install any needed packages specified in requirements.txt
# We install torch CPU only to save massive amounts of space and RAM
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY --chown=user . /app

# Expose the port FastAPI will run on
EXPOSE 7860

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
