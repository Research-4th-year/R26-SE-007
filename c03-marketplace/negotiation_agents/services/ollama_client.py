import json
from typing import Type, TypeVar

import ollama
from pydantic import BaseModel, ValidationError

from config import (
    OLLAMA_HOST,
    OLLAMA_MODEL,
)


ResponseSchema = TypeVar(
    "ResponseSchema",
    bound=BaseModel,
)


class OllamaAgentError(Exception):
    """Raised when an Ollama agent request fails."""


class OllamaClient:
    def __init__(self) -> None:
        self.client = ollama.Client(
            host=OLLAMA_HOST,
        )

    def check_connection(self) -> list[str]:
        try:
            response = self.client.list()

            models = getattr(
                response,
                "models",
                [],
            )

            model_names: list[str] = []

            for model in models:
                model_name = getattr(
                    model,
                    "model",
                    None,
                )

                if model_name:
                    model_names.append(
                        model_name
                    )

            return model_names

        except Exception as exc:
            raise OllamaAgentError(
                "Could not connect to Ollama at "
                f"{OLLAMA_HOST}. Ensure Ollama is running."
            ) from exc

    def generate_structured_response(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[ResponseSchema],
        max_attempts: int = 3,
    ) -> ResponseSchema:
        schema = response_schema.model_json_schema()

        last_raw_response = ""
        last_validation_error = ""

        for attempt in range(
            1,
            max_attempts + 1,
        ):
            correction_prompt = ""

            if attempt > 1:
             correction_prompt = f"""
Your previous JSON response was:

{last_raw_response}

It failed validation because:

{last_validation_error}

Correct the previous response.

Important:
- Include the price property.
- Use a numeric price for accept or counter_offer.
- Use null for reject.
- Return only the corrected JSON object.
"""
    
            complete_prompt = f"""
{user_prompt}

Required JSON schema:
{json.dumps(schema, indent=2)}

Output requirements:
- Return exactly one JSON object.
- Do not use Markdown code fences.
- Do not include text before or after the JSON.
- Use only values allowed by the schema.
- Use null when a field has no value.
{correction_prompt}
"""

            try:
                response = self.client.chat(
                    model=OLLAMA_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": system_prompt,
                        },
                        {
                            "role": "user",
                            "content": complete_prompt,
                        },
                    ],
                    format=schema,
                    stream=False,
                    options={
                        "temperature": 0,
                        "seed": 42,
                        "num_predict": 250,
                    },
                )

                last_raw_response = (
                    response.message.content
                )

                print(
                    f"\n--- Raw Ollama response "
                    f"(attempt {attempt}) ---"
                )
                print(last_raw_response)
                print("--- End raw response ---\n")

                return (
                    response_schema
                    .model_validate_json(
                        last_raw_response
                    )
                )

            except ValidationError as exc:
                last_validation_error = str(exc)

                print(
                    f"Validation failed on "
                    f"attempt {attempt}:"
                )
                print(last_validation_error)

            except Exception as exc:
                raise OllamaAgentError(
                    "Ollama request failed: "
                    f"{exc}"
                ) from exc

        raise OllamaAgentError(
            "The model failed structured-output "
            f"validation after {max_attempts} attempts.\n"
            f"Last raw response:\n{last_raw_response}\n"
            f"Last validation error:\n"
            f"{last_validation_error}"
        )