import json

from app.services.llm_client import llm_client
from app.schemas.llm_explanation import LLMExplanationEvidence
from app.schemas.llm_response import LLMExplanationResponse

from pydantic import ValidationError


class LLMExplanationService:

    def __init__(self):

        self.llm = llm_client

    def explain(
        self,
        evidence: LLMExplanationEvidence
    ) -> LLMExplanationResponse:

        try:

            system_prompt = self._build_system_prompt()

            user_prompt = self._build_user_prompt(
                evidence
            )

            response = self.llm.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )

            return LLMExplanationResponse.model_validate(
                response
            )

        except Exception:

            return self._fallback_explanation(
                evidence
            )

    def _fallback_explanation(
        self,
        evidence: LLMExplanationEvidence
    ) -> LLMExplanationResponse:

        key_factors = []

        for reason in evidence.shap_reasons[:3]:

            key_factors.append(
                f"English: {reason}\n"
                f"සිංහල: මෙම කරුණ මිල අනුමානයට බලපා ඇති වැදගත් කරුණකි."
            )

        explanation = (
            f"English: The model estimates the average paddy price at "
            f"{evidence.predicted_price:.2f} LKR/kg. "
            f"The expected price trend is "
            f"{evidence.trend.lower()}. "
            f"The model confidence is "
            f"{evidence.confidence.lower()}.\n\n"

            f"සිංහල: ආකෘතිය අනුව වී කිලෝග්‍රෑමයක මිල "
            f"රු. {evidence.predicted_price:.2f}ක් ලෙස අනුමාන කර ඇත. "
            f"මිලේ බලාපොරොත්තු වන වෙනස "
            f"{self._translate_trend(evidence.trend)}යි. "
            f"මෙම අනුමානයේ විශ්වාස මට්ටම "
            f"{self._translate_confidence(evidence.confidence)}යි."
        )

        return LLMExplanationResponse(

            headline=(
                f"English: Paddy price estimate: "
                f"{evidence.predicted_price:.2f} LKR/kg\n"
                f"සිංහල: වී මිල අනුමානය: "
                f"කිලෝග්‍රෑමයකට රු. {evidence.predicted_price:.2f}"
            ),

            explanation=explanation,

            key_factors=key_factors,

            farmer_summary=(
                f"English: {evidence.recommendation}\n\n"
                f"සිංහල: {self._fallback_sinhala_summary(evidence)}"
            ),

            generated_by="SHAP"
        )

    def _translate_trend(self, trend):

        translations = {

            "Strong Increase":
                "මිල හොඳින් ඉහළ යාමක්",

            "Increase":
                "මිල ඉහළ යාමක්",

            "Stable":
                "මිලේ ලොකු වෙනසක් නැති වීම",

            "Decrease":
                "මිල පහළ යාමක්",

            "Strong Decrease":
                "මිල හොඳින් පහළ යාමක්"
        }

        return translations.get(
            trend,
            "පැහැදිලි වෙනසක් පෙන්වන්නේ නැත"
        )

    def _translate_confidence(self, confidence):

        translations = {

            "High":
                "ඉහළයි",

            "Medium":
                "මධ්‍යමයි",

            "Low":
                "අඩුයි"
        }

        return translations.get(
            confidence,
            "අඩුයි"
        )

    def _fallback_sinhala_summary(self, evidence):

        summaries = {

            "Strong Increase":
                "වී මිල ඉහළ යාමක් අනුමාන කර ඇත. "
                "මිල තීරණයක් ගැනීමට පෙර පවතින වෙළඳපොළ තොරතුරු බලන්න.",

            "Increase":
                "වී මිල ඉහළ යාමක් අනුමාන කර ඇත. "
                "ඉදිරි සතිවල මිල වෙනස්වීම් ගැන අවධානයෙන් සිටීම හොඳයි.",

            "Stable":
                "වී මිලේ ලොකු වෙනසක් අනුමාන කර නැත. "
                "වෙළඳපොළේ මිල වෙනස්වීම් ගැන අවධානයෙන් සිටීම හොඳයි.",

            "Decrease":
                "වී මිල පහළ යාමක් අනුමාන කර ඇත. "
                "මිල තීරණයක් ගැනීමට පෙර වර්තමාන වෙළඳපොළ තොරතුරු බලන්න.",

            "Strong Decrease":
                "වී මිල හොඳින් පහළ යාමක් අනුමාන කර ඇත. "
                "මිල තීරණයක් ගැනීමට පෙර වෙළඳපොළ තොරතුරු හොඳින් බලන්න."
        }

        return summaries.get(
            evidence.trend,
            "මිල තීරණයක් ගැනීමට පෙර පවතින වෙළඳපොළ තොරතුරු බලන්න."
        )

    def _build_system_prompt(self):

        return """
You are a friendly AI assistant explaining a machine-learning
paddy price estimate to Sri Lankan farmers and general users.

The machine-learning model has ALREADY calculated the price.

Your job is ONLY to explain the supplied evidence in a simple,
natural and easy-to-understand way.

==================================================
IMPORTANT EVIDENCE RULES
==================================================

Use ONLY the information supplied in the model evidence.

NEVER:

- change the predicted price
- calculate another prediction
- invent information
- invent weather information
- invent rainfall information
- invent supply information
- invent demand information
- invent government policy information
- invent economic information
- invent agricultural information
- invent SHAP values
- invent feature values
- add features that are not provided
- claim that a feature caused the real-world price

SHAP describes how a feature influenced THIS MODEL'S prediction.

A positive SHAP contribution means that the feature pushed the
model estimate upward.

A negative SHAP contribution means that the feature pushed the
model estimate downward.

Do NOT describe SHAP as proof of a real-world cause.

==================================================
LANGUAGE REQUIREMENT
==================================================

THIS IS VERY IMPORTANT.

EVERY TEXT FIELD MUST CONTAIN BOTH ENGLISH AND SINHALA.

The output MUST contain Sinhala.

Do NOT return English-only output.

Do NOT translate only the headline.

Do NOT translate only the explanation.

The following fields ALL need English AND Sinhala:

1. headline
2. explanation
3. key_factors
4. farmer_summary

Use EXACTLY this format:

English: ...
සිංහල: ...

For example:

"English: The previous week's price was an important factor.
සිංහල: පෙර සතියේ මිල මෙම අනුමානයට බලපෑ වැදගත් කරුණක්."

==================================================
VERY SIMPLE SINHALA
==================================================

The Sinhala is for ordinary Sri Lankan farmers.

Use SIMPLE EVERYDAY SINHALA.

Do NOT use deep, academic, formal or difficult Sinhala.

Write Sinhala as a person would naturally explain something
to a farmer.

Use short sentences.

Prefer common words.

IMPORTANT:

Use:

"වී"

for "paddy".

NEVER use:

"සහල්"

when referring to paddy.

Examples:

"paddy price"
→ "වී මිල"

"paddy price estimate"
→ "වී මිල අනුමානය"

"paddy farmer"
→ "වී ගොවියා"

==================================================
SIMPLE WORD CHOICES
==================================================

Use these simple Sinhala words:

prediction / forecast
→ "අනුමානය"

price prediction
→ "මිල අනුමානය"

confidence
→ "විශ්වාස මට්ටම"

factor
→ "කරුණ"

influence / contribution
→ "බලපෑම"

trend
→ "මිලේ වෙනස"

increase
→ "ඉහළ යාම"

decrease
→ "පහළ යාම"

stable
→ "ලොකු වෙනසක් නැත"

Do NOT use difficult alternatives when a simple word is available.

For example:

DO NOT:
"පුරෝකථනය"

USE:
"අනුමානය"

DO NOT:
"ප්‍රවණතාව"

USE:
"මිලේ වෙනස"

DO NOT:
"වෙනස් විය යුතු නැත"

USE:
"වෙනස් නොවේ"

==================================================
NATURAL SINHALA
==================================================

Do NOT translate English word-by-word.

The Sinhala should sound natural.

Bad:

"පෙර සතියේ මිල මෙම පුරෝකථනය ඉහළ යාමට බලපෑ වැදගත් සාධකයක් විය."

Better:

"පෙර සතියේ මිල මෙම අනුමානය ඉහළ යාමට බලපෑ වැදගත් කරුණක්."

Another good example:

"English: The recent price was one of the main factors
behind this estimate.

සිංහල: මෑතකදී තිබූ මිල මෙම අනුමානයට බලපෑ ප්‍රධාන කරුණක්."

==================================================
DO NOT OVER-TRANSLATE TECHNICAL NAMES
==================================================

If a technical feature name is difficult to translate,
you may keep the feature name in English.

However, explain its meaning in simple Sinhala.

For example:

"English: The lag_1 value had a positive influence on the estimate.

සිංහල: lag_1 අගය මෙම අනුමානය ඉහළ යාමට බලපෑ කරුණක්."

==================================================
DYNAMIC EXPLANATIONS
==================================================

The explanation should feel natural and may use slightly
different wording when the same request is made again.

You may vary:

- sentence structure
- wording
- headline wording
- explanation order
- transitions
- how the important factors are described

However:

THE FACTS MUST NEVER CHANGE.

THE PREDICTED PRICE MUST NEVER CHANGE.

THE TREND MUST NEVER CHANGE.

THE CONFIDENCE MUST NEVER CHANGE.

THE RISK LEVEL MUST NEVER CHANGE.

THE SHAP INTERPRETATION MUST NEVER CHANGE.

Do not invent information just to make the response different.

==================================================
FARMER-FRIENDLY EXPLANATION
==================================================

Do not simply copy the technical evidence.

Explain it naturally.

The user should understand:

- what price was estimated
- whether the price may go up or down
- how confident the model is
- which supplied factors were important
- what those factors did to the model estimate

Keep it short.

Avoid unnecessary AI terminology.

==================================================
CONFIDENCE
==================================================

If confidence is High:

Explain that the supplied model evidence gives stronger support
for the estimate.

Do NOT say the prediction is guaranteed.

If confidence is Medium:

Explain that the estimate has a moderate level of support.

If confidence is Low:

Clearly say that the estimate should be treated carefully.

Do NOT create reasons for low confidence.

==================================================
FARMER SUMMARY
==================================================

Give a short and useful summary.

Do NOT give guaranteed financial advice.

Do NOT say:

"You must sell now."

"You must wait."

"You will definitely get a higher price."

Instead use simple wording such as:

"මිල තීරණයක් ගැනීමට පෙර වෙළඳපොළ තොරතුරු බලන්න."

or:

"ඉදිරි මිල වෙනස්වීම් ගැන අවධානයෙන් සිටීම හොඳයි."

==================================================
OUTPUT JSON
==================================================

Return ONLY valid JSON.

Do NOT use Markdown.

Do NOT use code fences.

Do NOT add any text outside the JSON.

DO NOT change the JSON structure.

DO NOT add fields.

DO NOT remove fields.

DO NOT rename fields.

Use EXACTLY:

{
    "headline": "English: ...\\nසිංහල: ...",
    "explanation": "English: ...\\n\\nසිංහල: ...",
    "key_factors": [
        "English: ...\\nසිංහල: ...",
        "English: ...\\nසිංහල: ...",
        "English: ...\\nසිංහල: ..."
    ],
    "farmer_summary": "English: ...\\n\\nසිංහල: ..."
}

There MUST be exactly 3 key_factors.

Every string MUST contain BOTH English and Sinhala.

The JSON field names MUST remain exactly:

headline
explanation
key_factors
farmer_summary
"""

    def _build_user_prompt(
        self,
        evidence: LLMExplanationEvidence
    ):

        evidence_dict = evidence.model_dump()

        return f"""
Create a simple bilingual explanation for this paddy price estimate.

The user is a Sri Lankan farmer or general user.

The model has already produced the estimate.

Use ONLY the supplied evidence.

==================================================
MODEL EVIDENCE
==================================================

{json.dumps(
    evidence_dict,
    indent=2,
    ensure_ascii=False
)}

==================================================
IMPORTANT
==================================================

Do not change the predicted price.

Do not calculate another prediction.

Do not add outside information.

Do not invent weather, supply, demand, policy or market information.

Use only the supplied SHAP factors.

Positive SHAP contribution:
The feature pushed this model estimate upward.

Negative SHAP contribution:
The feature pushed this model estimate downward.

Do not describe SHAP as a real-world cause.

==================================================
LANGUAGE
==================================================

The output MUST contain BOTH English and Sinhala.

Every single text field must contain both.

That means:

headline → English + Sinhala

explanation → English + Sinhala

key_factors → English + Sinhala in EACH of the 3 items

farmer_summary → English + Sinhala

Use:

English: ...

සිංහල: ...

==================================================
SINHALA REQUIREMENT
==================================================

Use VERY SIMPLE everyday Sinhala.

The user should understand it immediately.

Do not use deep Sinhala.

Do not use academic Sinhala.

Do not use complicated technical Sinhala.

IMPORTANT:

paddy = "වී"

NOT "සහල්"

prediction / forecast = "අනුමානය"

NOT "පුරෝකථනය"

trend = "මිලේ වෙනස"

NOT "ප්‍රවණතාව"

confidence = "විශ්වාස මට්ටම"

contribution / influence = "බලපෑම"

Prefer:

"වෙනස් නොවේ"

instead of:

"වෙනස් විය යුතු නැත"

==================================================
FINAL CHECK BEFORE RESPONSE
==================================================

Before returning the JSON, make sure:

1. Sinhala appears in headline.
2. Sinhala appears in explanation.
3. Sinhala appears in key_factor 1.
4. Sinhala appears in key_factor 2.
5. Sinhala appears in key_factor 3.
6. Sinhala appears in farmer_summary.
7. "paddy" is translated as "වී".
8. Do not use "සහල්" for paddy.
9. Use "අනුමානය" instead of "පුරෝකථනය".
10. Use simple Sinhala.
11. Do not change the JSON structure.
12. Return exactly 3 key factors.
13. Return ONLY JSON.

==================================================
REQUIRED JSON STRUCTURE
==================================================

{{
    "headline": "English: ...\\nසිංහල: ...",
    "explanation": "English: ...\\n\\nසිංහල: ...",
    "key_factors": [
        "English: ...\\nසිංහල: ...",
        "English: ...\\nසිංහල: ...",
        "English: ...\\nසිංහල: ..."
    ],
    "farmer_summary": "English: ...\\n\\nසිංහල: ..."
}}
"""


llm_explanation_service = LLMExplanationService()