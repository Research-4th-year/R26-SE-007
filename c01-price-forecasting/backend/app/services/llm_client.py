import json

from openai import OpenAI

from app.core.config import (
    OPENAI_API_KEY,
    OPENAI_MODEL
)


class LLMClient:

    def __init__(self):

        if not OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY is not configured."
            )

        self.client = OpenAI(
            api_key=OPENAI_API_KEY
        )

        self.model = OPENAI_MODEL

    def generate(
        self,
        system_prompt: str,
        user_prompt: str
    ):

        response = self.client.chat.completions.create(

            model=self.model,

            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],

            temperature=0.2,

            response_format={
                "type": "json_object"
            }
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError(
                "LLM returned an empty response."
            )

        try:

            return json.loads(content)

        except json.JSONDecodeError as e:

            raise ValueError(
                "LLM returned invalid JSON."
            ) from e

llm_client = LLMClient()