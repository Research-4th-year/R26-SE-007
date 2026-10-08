# Python 3.12 rather than 3.13: torch and asyncmy publish aarch64 wheels for
# 3.12, and a missing wheel means compiling PyTorch from source on a 2-core
# ARM box, which does not finish in any reasonable time.
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# gcc/g++ are a fallback for asyncmy, which is Cython and may need to build
# if no aarch64 wheel matches. Removed again once pip is done.
RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc g++ curl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
 && apt-get purge -y gcc g++ \
 && apt-get autoremove -y

# Source, trained model weights and the synthetic training data
COPY main.py ./
COPY src ./src
COPY models ./models
COPY data ./data

RUN useradd -m -u 1001 gnn && chown -R gnn:gnn /app
USER gnn

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

# --host 0.0.0.0 is required: the default 127.0.0.1 is unreachable from
# other containers on the compose network.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
