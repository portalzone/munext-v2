FROM python:3.11-slim

# Java is required to run Spark (Spark runs on the JVM)
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/default-java

WORKDIR /spark

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default command — override per pipeline when running
CMD ["python", "pipelines/jobs_analytics.py"]
