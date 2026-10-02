import json
from typing import Type, TypeVar

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    OpenAI,
    RateLimitError,
)
from pydantic import BaseModel, ValidationError

from config import (
    OPENAI_NEGOTIATION_API_KEY,
    OPENAI_NEGOTIATION_MODEL,
    OPENAI_NEGOTIATION_TIMEOUT_SECONDS,
)


ResponseSchema = TypeVar(
    "ResponseSchema",
    bound=BaseModel,
)


class OpenAIAgentError(Exception):
    """Raised when an OpenAI agent request fails."""


class OpenAIClient:
    def __init__(self) -> None:
        self.api_key = (
            OPENAI_NEGOTIATION_API_KEY or ""
        ).strip()
        self.model = (
            OPENAI_NEGOTIATION_MODEL or ""
        ).strip()
        self._client: OpenAI | None = None

    def _ensure_ready(self) -> OpenAI:
        if not self.api_key:
            raise OpenAIAgentError(
                "OPENAI_NEGOTIATION_API_KEY is not configured."
            )

        if not self.model:
            raise OpenAIAgentError(
                "OPENAI_NEGOTIATION_MODEL is not configured."
            )

        if self._client is None:
            self._client = OpenAI(
                api_key=self.api_key,
                timeout=OPENAI_NEGOTIATION_TIMEOUT_SECONDS,
            )

        return self._client

    def check_configuration(self) -> dict:
        self._ensure_ready()

        return {
            "provider": "openai",
            "model": self.model,
            "api_key_configured": True,
        }

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
                client = self._ensure_ready()

                response = client.chat.completions.create(
                    model=self.model,
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
                    response_format={
                        "type": "json_object",
                    },
                    temperature=0,
                    max_tokens=250,
                )

                if not response.choices:
                    last_raw_response = ""
                    last_validation_error = (
                        "OpenAI returned no choices."
                    )
                    print(
                        f"Empty OpenAI response on "
                        f"attempt {attempt}"
                    )
                    continue

                last_raw_response = (
                    response.choices[0].message.content
                    or ""
                )

                print(
                    f"\n--- Raw OpenAI response "
                    f"(attempt {attempt}) ---"
                )
                print(last_raw_response)
                print("--- End raw response ---\n")

                if not last_raw_response.strip():
                    last_validation_error = (
                        "OpenAI returned an empty response."
                    )
                    continue

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

            except AuthenticationError as exc:
                raise OpenAIAgentError(
                    "OpenAI authentication failed. "
                    "Check OPENAI_NEGOTIATION_API_KEY."
                ) from exc

            except NotFoundError as exc:
                raise OpenAIAgentError(
                    "The configured OpenAI negotiation "
                    "model was not found. "
                    "Check OPENAI_NEGOTIATION_MODEL."
                ) from exc

            except BadRequestError as exc:
                raise OpenAIAgentError(
                    "OpenAI rejected the negotiation "
                    "model or request configuration."
                ) from exc

            except APITimeoutError as exc:
                raise OpenAIAgentError(
                    "OpenAI request timed out."
                ) from exc

            except APIConnectionError as exc:
                raise OpenAIAgentError(
                    "Could not connect to the OpenAI API."
                ) from exc

            except RateLimitError as exc:
                raise OpenAIAgentError(
                    "OpenAI rate limit exceeded."
                ) from exc

            except APIStatusError as exc:
                raise OpenAIAgentError(
                    "OpenAI API error "
                    f"(status {exc.status_code})."
                ) from exc

            except OpenAIAgentError:
                raise

            except Exception as exc:
                raise OpenAIAgentError(
                    "OpenAI request failed: "
                    f"{type(exc).__name__}"
                ) from exc

        raise OpenAIAgentError(
            "The model failed structured-output "
            f"validation after {max_attempts} attempts.\n"
            f"Last raw response:\n{last_raw_response}\n"
            f"Last validation error:\n"
            f"{last_validation_error}"
        )
