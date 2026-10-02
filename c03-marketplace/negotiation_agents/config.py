import os

from dotenv import load_dotenv


load_dotenv()


OPENAI_NEGOTIATION_API_KEY = os.getenv(
    "OPENAI_NEGOTIATION_API_KEY",
    "",
)

OPENAI_NEGOTIATION_MODEL = os.getenv(
    "OPENAI_NEGOTIATION_MODEL",
    "",
)

OPENAI_NEGOTIATION_TIMEOUT_SECONDS = float(
    os.getenv(
        "OPENAI_NEGOTIATION_TIMEOUT_SECONDS",
        "120",
    )
)

AGENT_TEMPERATURE = float(
    os.getenv("AGENT_TEMPERATURE", "0.1")
)
