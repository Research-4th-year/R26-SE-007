FROM python:3.14-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && python --version \
    && node --version \
    && npm --version

ENV HF_HOME=/opt/hf-cache
ENV TRANSFORMERS_CACHE=/opt/hf-cache
ENV HF_HUB_DISABLE_TELEMETRY=1
ENV TOKENIZERS_PARALLELISM=false

WORKDIR /app

COPY rag/requirements.txt /app/rag/requirements.txt
COPY fl/requirements.txt /app/fl/requirements.txt

# Install CPU PyTorch first. Default Linux pip torch pulls NVIDIA CUDA packages.
RUN pip install --no-cache-dir --root-user-action=ignore \
    torch --index-url https://download.pytorch.org/whl/cpu

# FL runtime plus RAG packages other than sentence-transformers.
RUN pip install --no-cache-dir --root-user-action=ignore \
    -r /app/fl/requirements.txt \
    faiss-cpu \
    openai

# Do not let sentence-transformers replace CPU torch with CUDA torch.
RUN pip install --no-cache-dir --root-user-action=ignore \
    sentence-transformers --no-deps \
    && pip install --no-cache-dir --root-user-action=ignore \
    transformers tokenizers huggingface-hub scipy tqdm typing_extensions

# Preload the exact C03 embedding model so containers do not download it on every start.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', device='cpu')"

COPY backend/package.json backend/package-lock.json /app/backend/

WORKDIR /app/backend

RUN npm ci --omit=dev

COPY backend/ /app/backend/
COPY rag/ /app/rag/
COPY fl/ /app/fl/

EXPOSE 5000

CMD ["node", "src/server.js"]
