import os

from dotenv import load_dotenv


load_dotenv()


OLLAMA_HOST = os.getenv(
    "OLLAMA_HOST",
    "http://192.168.8.141:11434",
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "qwen2.5:3b-instruct",
)

OLLAMA_TIMEOUT_SECONDS = int(
    os.getenv("OLLAMA_TIMEOUT_SECONDS", "120")
)

AGENT_TEMPERATURE = float(
    os.getenv("AGENT_TEMPERATURE", "0.1")
)