import os

from pathlib import Path
from dotenv import load_dotenv


# Load environment variables from .env
load_dotenv()


BASE_DIR = Path(__file__).resolve().parent.parent


MODEL_PATH = BASE_DIR / "models" / "xgboost_model.pkl"

DATA_PATH = BASE_DIR / "data" / "cleaned_data.csv"


# LLM configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

OPENAI_MODEL = os.getenv(
    "OPENAI_MODEL",
    "gpt-4o-mini"
)