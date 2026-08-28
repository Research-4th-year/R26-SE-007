import sys
import json
import os
import re
import warnings



# ==========================================================
# WINDOWS UTF-8 CONFIGURATION
# ==========================================================

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(
        encoding="utf-8"
    )

if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(
        encoding="utf-8"
    )

if hasattr(sys.stdin, "reconfigure"):
    sys.stdin.reconfigure(
        encoding="utf-8"
    )

warnings.filterwarnings("ignore")

os.environ[
    "TOKENIZERS_PARALLELISM"
] = "false"

old_stderr = sys.stderr

sys.stderr = open(
    os.devnull,
    "w",
    encoding="utf-8",
)

try:
    import faiss
    import numpy as np

    from sentence_transformers import (
        SentenceTransformer,
    )

    from openai import OpenAI

finally:
    sys.stderr = old_stderr


# ==========================================================
# CONFIGURATION
# ==========================================================

CURRENT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

INDEX_DIR = os.path.join(
    CURRENT_DIR,
    "indexes",
)

INDEX_FILE = os.path.join(
    INDEX_DIR,
    "marketplace_knowledge.faiss",
)

METADATA_FILE = os.path.join(
    INDEX_DIR,
    "marketplace_metadata.json",
)

MODEL_NAME = (
    "sentence-transformers/"
    "paraphrase-multilingual-MiniLM-L12-v2"
)

TOP_K = 6

MIN_SIMILARITY = 0.20


# ==========================================================
# OPENAI
# ==========================================================

client = OpenAI()


# ==========================================================
# LOAD EMBEDDING MODEL
# ==========================================================

sys.stderr = open(
    os.devnull,
    "w",
    encoding="utf-8",
)

try:
    model = SentenceTransformer(
        MODEL_NAME
    )
finally:
    sys.stderr = old_stderr


# ==========================================================
# LOAD FAISS INDEX
# ==========================================================

if not os.path.exists(
    INDEX_FILE
):
    raise FileNotFoundError(
        "RAG index was not found. "
        "Run python build_index.py first."
    )

if not os.path.exists(
    METADATA_FILE
):
    raise FileNotFoundError(
        "RAG metadata was not found. "
        "Run python build_index.py first."
    )

index = faiss.read_index(
    INDEX_FILE
)

with open(
    METADATA_FILE,
    "r",
    encoding="utf-8",
) as file:
    knowledge_records = json.load(
        file
    )


# ==========================================================
# BASIC TEXT HELPERS
# ==========================================================

def normalize_text(value):
    return re.sub(
        r"\s+",
        " ",
        str(value or ""),
    ).strip()


def contains_sinhala(text):
    return bool(
        re.search(
            r"[\u0D80-\u0DFF]",
            text,
        )
    )


# ==========================================================
# SINHALA NORMALIZATION
# ==========================================================

SINHALA_NORMALIZATION = {
    "කීරි සම්බා":
        "keeri samba",

    "කිරි සම්බා":
        "keeri samba",

    "නාඩු":
        "nadu",

    "සම්බා":
        "samba",

    "මිල":
        "price",

    "ගාන":
        "price",

    "ගණන":
        "price",

    "තෙතමනය":
        "moisture",

    "ප්‍රමිතිය":
        "quality",

    "ප්‍රමිතීන්":
        "quality",

    "ගොවියා":
        "farmer",

    "ගොවී":
        "farmer",

    "මෝල්කරු":
        "miller",

    "මෝල්":
        "miller",

    "අස්වැන්න":
        "harvest",

    "අස්වනු":
        "harvest",

    "ඉල්ලුම":
        "demand",

    "ගැලපීම":
        "matching",

    "ගැලපෙන":
        "matching",

    "සම්බන්ධතාව":
        "connection",

    "සම්බන්ධ":
        "connection",

    "සාකච්ඡාව":
        "negotiation",

    "දුරකථන":
        "phone",

    "වට්ස්ඇප්":
        "whatsapp",
}


# ==========================================================
# SINGLISH NORMALIZATION
# ==========================================================

SINGLISH_NORMALIZATION = {

    # ------------------------------------------------------
    # Paddy types
    # ------------------------------------------------------

    "keeri samba":
        "keeri samba",

    "kiri samba":
        "keeri samba",

    "keeri":
        "keeri samba",

    "nadu":
        "nadu",

    "samba":
        "samba",


    # ------------------------------------------------------
    # Price
    # ------------------------------------------------------

    "mila":
        "price",

    "mile":
        "price",

    "gana":
        "price",

    "ganan":
        "price",

    "gaana":
        "price",

    "ganne":
        "price",

    "rate eka":
        "price",


    # ------------------------------------------------------
    # Question expressions
    # ------------------------------------------------------

    "kiiyada":
        "what is",

    "kiyadha":
        "what is",

    "keeyada":
        "what is",

    "kiyada":
        "what is",

    "kochchara":
        "how much",

    "kochodha":
        "how much",

    "mokakda":
        "what is",

    "mokadda":
        "what is",

    "monawada":
        "what are",


    # ------------------------------------------------------
    # Quality
    # ------------------------------------------------------

    "thethamanaya":
        "moisture",

    "tethamanaya":
        "moisture",

    "thetamanaya":
        "moisture",

    "moisture eka":
        "moisture",

    "pramithiya":
        "quality",

    "pramitiya":
        "quality",

    "pramithiya":
        "quality",

    "quality eka":
        "quality",

    "apadawa":
        "admixture",


    # ------------------------------------------------------
    # Farmer
    # ------------------------------------------------------

    "goviya":
        "farmer",

    "govi":
        "farmer",

    "goviyek":
        "farmer",

    "govinta":
        "farmer",

    "goviyata":
        "farmer",

    "farmer ta":
        "farmer",


    # ------------------------------------------------------
    # Miller
    # ------------------------------------------------------

    "molkaru":
        "miller",

    "mol karu":
        "miller",

    "molkaruwa":
        "miller",

    "miller ta":
        "miller",

    "millerge":
        "miller",


    # ------------------------------------------------------
    # Harvest
    # ------------------------------------------------------

    "aswanna":
        "harvest",

    "aswenna":
        "harvest",

    "aswanu":
        "harvest",

    "harvest eka":
        "harvest",


    # ------------------------------------------------------
    # Demand
    # ------------------------------------------------------

    "illuma":
        "demand",

    "illume":
        "demand",

    "demand eka":
        "demand",


    # ------------------------------------------------------
    # Matching
    # ------------------------------------------------------

    "galapima":
        "matching",

    "galapenawa":
        "matching",

    "galapena":
        "matching",

    "match eka":
        "matching",

    "match karanne":
        "matching",

    "match wenne":
        "matching",


    # ------------------------------------------------------
    # Negotiation
    # ------------------------------------------------------

    "negotiation eka":
        "negotiation",

    "negotiation karanne":
        "negotiation",

    "deal eka":
        "negotiation",

    "ganudenu kathawa":
        "negotiation",


    # ------------------------------------------------------
    # Connection / partner
    # ------------------------------------------------------

    "connect wenna":
        "connection",

    "connect karanne":
        "connection",

    "connection eka":
        "connection",

    "sambanda wenna":
        "connection",

    "sambandha wenna":
        "connection",

    "partner kenek":
        "partner",

    "partner eka":
        "partner",


    # ------------------------------------------------------
    # Contact
    # ------------------------------------------------------

    "phone number":
        "phone",

    "phone eka":
        "phone",

    "call karanna":
        "phone contact",

    "whatsapp karanna":
        "whatsapp contact",

    "contact karanna":
        "contact",


    # ------------------------------------------------------
    # Privacy
    # ------------------------------------------------------

    "penawada":
        "can see",

    "penenawada":
        "can see",

    "balanna puluwanda":
        "can see",

    "private da":
        "private",

    "rahasi":
        "private",


    # ------------------------------------------------------
    # Actions
    # ------------------------------------------------------

    "cancel karanna":
        "cancel",

    "accept karanna":
        "accept",

    "reject karanna":
        "reject",

    "yawanna":
        "send",

    "send karanna":
        "send",


    # ------------------------------------------------------
    # Common Singlish connectors
    # ------------------------------------------------------

    "mage":
        "my",

    "mama":
        "i",

    "mata":
        "me",

    "oyata":
        "you",

    "ekak":
        "one",

    "eka":
        "",

    "thiyenawada":
        "available",

    "tiyenawada":
        "available",

    "thiyena":
        "available",

    "tiyena":
        "available",
}


# ==========================================================
# NORMALIZE SINHALA QUERY
# ==========================================================

def normalize_sinhala_query(
    query,
):
    normalized = query

    replacements = sorted(
        SINHALA_NORMALIZATION.items(),
        key=lambda item:
            len(
                item[0]
            ),
        reverse=True,
    )

    for phrase, replacement in replacements:
        normalized = normalized.replace(
            phrase,
            replacement,
        )

    return normalize_text(
        normalized.lower()
    )


# ==========================================================
# NORMALIZE SINGLISH QUERY
# ==========================================================

def normalize_singlish_query(
    query,
):
    normalized = (
        query
        .lower()
        .strip()
    )

    normalized = re.sub(
        r"[?!.,;:]",
        " ",
        normalized,
    )

    normalized = normalize_text(
        normalized
    )

    replacements = sorted(
        SINGLISH_NORMALIZATION.items(),
        key=lambda item:
            len(
                item[0]
            ),
        reverse=True,
    )

    for phrase, replacement in replacements:

        pattern = (
            r"\b"
            + re.escape(
                phrase
            )
            + r"\b"
        )

        normalized = re.sub(
            pattern,
            replacement,
            normalized,
            flags=re.IGNORECASE,
        )

    return normalize_text(
        normalized
    )


# ==========================================================
# DETECT WHETHER ROMAN TEXT LOOKS LIKE SINGLISH
# ==========================================================

SINGLISH_MARKERS = [
    "mila",
    "gana",
    "ganan",
    "kiiyada",
    "kiyadha",
    "keeyada",
    "kiyada",
    "kochchara",
    "mokakda",
    "mokadda",
    "monawada",

    "goviya",
    "govi",

    "molkaru",
    "mol karu",

    "aswanna",
    "aswanu",

    "illuma",

    "galapima",
    "galapenawa",

    "penawada",
    "penenawada",

    "thiyenawada",
    "tiyenawada",

    "karanna",
    "wenna",
    "wenne",

    "mage",
    "mata",
    "mama",
]


def looks_like_singlish(
    query,
):
    q = query.lower()

    marker_count = sum(
        1
        for marker in SINGLISH_MARKERS
        if marker in q
    )

    return marker_count >= 1


# ==========================================================
# LANGUAGE STYLE DETECTION
# ==========================================================

def detect_language_style(
    query,
):
    if contains_sinhala(
        query
    ):
        return "sinhala"

    if looks_like_singlish(
        query
    ):
        return "singlish"

    return "english"


# ==========================================================
# BUILD NORMALIZED QUERY
# ==========================================================

def build_normalized_query(
    query,
):
    language_style = (
        detect_language_style(
            query
        )
    )

    if language_style == "sinhala":

        normalized = (
            normalize_sinhala_query(
                query
            )
        )

    elif language_style == "singlish":

        normalized = (
            normalize_singlish_query(
                query
            )
        )

    else:

        normalized = (
            normalize_text(
                query.lower()
            )
        )

    return {
        "languageStyle":
            language_style,

        "normalizedQuery":
            normalized,
    }


# ==========================================================
# INTENT ROUTER
# ==========================================================

def route_query(
    query,
):
    q = query.lower()

    quality_terms = [
        "quality",
        "moisture",
        "admixture",
        "broken",
        "empty grain",
        "insect",
        "quality requirement",
    ]

    price_terms = [
        "price",
        "rate",
        "nadu price",
        "samba price",
        "keeri samba price",
    ]

    quantity_terms = [
        "2500",
        "5000",
        "quantity limit",
        "how much paddy",
        "maximum quantity",
        "purchase quantity",
    ]

    negotiation_terms = [
        "negotiation",
        "negotiate",
        "minimum acceptable",
        "maximum buying",
        "private minimum",
        "private maximum",
        "agent",
        "counter offer",
        "counter_offer",
    ]

    matching_terms = [
        "matching",
        "match request",
        "matching score",
        "find miller",
        "find farmer",
        "match farmer",
        "match miller",
    ]

    connection_terms = [
        "connection",
        "connect",
        "partner",
        "cancel request",
        "contact",
        "whatsapp",
        "phone",
    ]

    harvest_terms = [
        "harvest",
        "expected price",
        "add harvest",
    ]

    demand_terms = [
        "demand",
        "offered price",
        "create demand",
    ]

    fl_terms = [
        "federated",
        "fl price",
        "ai predicted",
        "predicted price",
        "reference price",
    ]

    if any(
        term in q
        for term in quality_terms
    ):
        return "PMB_QUALITY"

    if any(
            term in q
            for term in negotiation_terms
        ):
            return "NEGOTIATION_HELP"

    if any(
            term in q
            for term in fl_terms
        ):
            return "FL_PRICE_HELP"

    if any(
        term in q
        for term in price_terms
    ):
        return "PMB_PRICE"

    if any(
        term in q
        for term in quantity_terms
    ):
        return "PMB_QUANTITY"

    if any(
        term in q
        for term in matching_terms
    ):
        return "MATCHING_HELP"

    if any(
        term in q
        for term in connection_terms
    ):
        return "CONNECTION_HELP"

    if any(
        term in q
        for term in harvest_terms
    ):
        return "HARVEST_HELP"

    if any(
        term in q
        for term in demand_terms
    ):
        return "DEMAND_HELP"

    

    return "GENERAL_MARKETPLACE"


# ==========================================================
# INTENT CATEGORY BOOST
# ==========================================================

def get_category_bonus(
    intent,
    category,
):
    mappings = {
        "PMB_QUALITY": [
            "pmb_quality",
        ],

        "PMB_PRICE": [
            "pmb_price",
        ],

        "PMB_QUANTITY": [
            "pmb_quantity",
            "pmb_procedure",
        ],

        "NEGOTIATION_HELP": [
            "negotiation",
            "privacy",
            "fl_price",
        ],

        "MATCHING_HELP": [
            "matching",
        ],

        "CONNECTION_HELP": [
            "connection",
            "contact",
            "partners",
        ],

        "HARVEST_HELP": [
            "harvest",
            "fl_price",
        ],

        "DEMAND_HELP": [
            "demand",
        ],

        "FL_PRICE_HELP": [
            "fl_price",
            "harvest",
            "negotiation",
        ],
    }

    categories = mappings.get(
        intent,
        [],
    )

    if category in categories:
        return 0.12

    return 0.0


# ==========================================================
# RETRIEVAL
# ==========================================================

def retrieve(
    query,
    intent,
    k=TOP_K,
):
    embedding = model.encode(
        [query],
        convert_to_numpy=True,
    )

    embedding = np.asarray(
        embedding,
        dtype="float32",
    )

    faiss.normalize_L2(
        embedding
    )

    search_k = min(
        max(
            k * 3,
            10,
        ),
        len(
            knowledge_records
        ),
    )

    scores, positions = index.search(
        embedding,
        search_k,
    )

    candidates = []

    for score, position in zip(
        scores[0],
        positions[0],
    ):
        if position < 0:
            continue

        record = knowledge_records[
            int(
                position
            )
        ]

        semantic_score = float(
            score
        )

        category_bonus = (
            get_category_bonus(
                intent,
                record.get(
                    "category",
                    "",
                ),
            )
        )

        adjusted_score = (
            semantic_score
            + category_bonus
        )

        candidates.append(
            {
                "score":
                    adjusted_score,

                "semanticScore":
                    semantic_score,

                "record":
                    record,
            }
        )

    candidates.sort(
        key=lambda item:
            item[
                "score"
            ],
        reverse=True,
    )

    relevant = [
        item
        for item in candidates
        if item[
            "semanticScore"
        ] >= MIN_SIMILARITY
    ]

    if not relevant:
        relevant = candidates[
            : min(
                3,
                len(
                    candidates
                ),
            )
        ]

    return relevant[:k]


# ==========================================================
# BUILD CONTEXT
# ==========================================================

def build_context(
    retrieved,
):
    blocks = []

    for number, item in enumerate(
        retrieved,
        start=1,
    ):
        record = item[
            "record"
        ]

        block = (
            f"[SOURCE {number}]\n"
            f"ID: {record.get('id', '')}\n"
            f"Title: {record.get('title', '')}\n"
            f"Organization: {record.get('organization', '')}\n"
            f"Section: {record.get('section', '')}\n"
            f"Content: {record.get('content', '')}"
        )

        blocks.append(
            block
        )

    return "\n\n".join(
        blocks
    )


# ==========================================================
# BUILD FRONTEND SOURCES
# ==========================================================

def build_sources(
    retrieved,
):
    sources = []

    seen_ids = set()

    for item in retrieved:
        record = item[
            "record"
        ]

        source_id = record.get(
            "id"
        )

        if (
            not source_id
            or source_id
            in seen_ids
        ):
            continue

        seen_ids.add(
            source_id
        )

        sources.append(
            {
                "id":
                    source_id,

                "title":
                    record.get(
                        "title",
                        "",
                    ),

                "organization":
                    record.get(
                        "organization",
                        "",
                    ),

                "document":
                    record.get(
                        "document",
                        "",
                    ),

                "section":
                    record.get(
                        "section",
                        "",
                    ),

                "category":
                    record.get(
                        "category",
                        "",
                    ),

                "year":
                    record.get(
                        "year",
                        None,
                    ),

                "season":
                    record.get(
                        "season",
                        None,
                    ),

                "relevanceScore":
                    round(
                        item[
                            "semanticScore"
                        ],
                        4,
                    ),
            }
        )

    return sources


# ==========================================================
# SUGGESTED QUESTIONS
# ==========================================================

def suggested_questions(
    intent,
    language_style,
):

    english = {
        "PMB_QUALITY": [
            "What is the PMB moisture limit?",
            "What is the maximum admixture percentage?",
            "What happens if paddy fails the quality check?",
        ],

        "PMB_PRICE": [
            "What is the PMB price for Nadu?",
            "What is the PMB price for Samba?",
            "What is the PMB price for Keeri Samba?",
        ],

        "PMB_QUANTITY": [
            "How much paddy can one farmer normally sell to PMB?",
            "When can the quantity increase to 5,000 kg?",
            "What are the PMB purchasing requirements?",
        ],

        "MATCHING_HELP": [
            "How is the matching score calculated?",
            "How can a Farmer send a match request?",
            "When does a match become ready for negotiation?",
        ],

        "NEGOTIATION_HELP": [
            "How does AI negotiation work?",
            "Can a Miller see the Farmer's minimum price?",
            "What is the FL reference price used for?",
        ],

        "CONNECTION_HELP": [
            "How do I connect with a marketplace partner?",
            "When does contact information become visible?",
            "Can I cancel a pending connection request?",
        ],

        "HARVEST_HELP": [
            "What information is needed to create a Harvest?",
            "What does the AI predicted price mean?",
            "How can I find matching Millers?",
        ],

        "DEMAND_HELP": [
            "What information is needed to create a Demand?",
            "How can a Miller find matching Farmers?",
            "When can AI negotiation start?",
        ],

        "FL_PRICE_HELP": [
            "What does the AI predicted price mean?",
            "Is the FL price shown to both parties?",
            "How is the FL reference used in negotiation?",
        ],

        "GENERAL_MARKETPLACE": [
            "How does marketplace matching work?",
            "How does AI negotiation work?",
            "What are the PMB quality requirements?",
        ],
    }


    # ======================================================
    # IMPORTANT:
    #
    # Singlish QUESTIONS are also returned as Sinhala-script
    # suggestions because the ANSWER LANGUAGE is Sinhala.
    # ======================================================

    sinhala = {

        "PMB_QUALITY": [
            "PMB තෙතමන සීමාව කීයද?",
            "උපරිම අපද්‍රව්‍ය ප්‍රතිශතය කීයද?",
            "ප්‍රමිතියට නොගැළපුණොත් මොකද වෙන්නේ?",
        ],

        "PMB_PRICE": [
            "නාඩු මිල කීයද?",
            "සම්බා මිල කීයද?",
            "කීරි සම්බා මිල කීයද?",
        ],

        "PMB_QUANTITY": [
            "ගොවියෙකුට PMB එකට කොපමණ වී ප්‍රමාණයක් ලබා දෙන්න පුළුවන්ද?",
            "කිලෝ 5000 දක්වා ප්‍රමාණය වැඩි කරන්නේ කොහොමද?",
            "PMB මිලදී ගැනීමේ අවශ්‍යතා මොනවාද?",
        ],

        "MATCHING_HELP": [
            "Matching score එක හදන්නේ කොහොමද?",
            "ගොවියෙකුට match request එකක් යවන්නේ කොහොමද?",
            "Negotiation සඳහා match එක සූදානම් වෙන්නේ කවදාද?",
        ],

        "NEGOTIATION_HELP": [
            "AI negotiation එක වැඩ කරන්නේ කොහොමද?",
            "Miller ට ගොවියාගේ අවම මිල පේනවද?",
            "FL reference price එක භාවිතා කරන්නේ මොකටද?",
        ],

        "CONNECTION_HELP": [
            "Marketplace partner කෙනෙක් සමඟ සම්බන්ධ වෙන්නේ කොහොමද?",
            "Contact details පෙන්වන්නේ කවදාද?",
            "Pending connection request එකක් cancel කරන්න පුළුවන්ද?",
        ],

        "HARVEST_HELP": [
            "Harvest එකක් add කරන්න අවශ්‍ය තොරතුරු මොනවාද?",
            "AI predicted price කියන්නේ මොකක්ද?",
            "ගැළපෙන Millers ලා හොයාගන්නේ කොහොමද?",
        ],

        "DEMAND_HELP": [
            "Demand එකක් create කරන්න අවශ්‍ය තොරතුරු මොනවාද?",
            "ගැළපෙන Farmers ලා හොයාගන්නේ කොහොමද?",
            "AI negotiation පටන් ගන්නේ කවදාද?",
        ],

        "FL_PRICE_HELP": [
            "AI predicted price කියන්නේ මොකක්ද?",
            "FL price එක දෙපාර්ශ්වයටම පේනවද?",
            "Negotiation එකේදී FL price එක භාවිතා කරන්නේ කොහොමද?",
        ],

        "GENERAL_MARKETPLACE": [
            "Marketplace matching එක වැඩ කරන්නේ කොහොමද?",
            "AI negotiation එක වැඩ කරන්නේ කොහොමද?",
            "PMB quality requirements මොනවාද?",
        ],
    }


    if language_style == "english":
        return english.get(
            intent,
            english[
                "GENERAL_MARKETPLACE"
            ],
        )

    return sinhala.get(
        intent,
        sinhala[
            "GENERAL_MARKETPLACE"
        ],
    )


# ==========================================================
# GPT LANGUAGE INSTRUCTIONS
# ==========================================================

def build_language_instruction(
    language_style,
):

    # ======================================================
    # SINHALA SCRIPT INPUT
    # ======================================================

    if language_style == "sinhala":

        return """
The user asked the question in Sinhala script.

ANSWER MUST BE IN NATURAL SINHALA SCRIPT.

Use simple, farmer-friendly Sri Lankan Sinhala.

Do NOT answer in Singlish.

Do NOT answer primarily in English.

Technical marketplace terms may remain in English when that
is clearer or commonly used, such as:

PMB
AI
FL
WhatsApp
Digital Goviya
matching
negotiation
Harvest
Demand

However, the surrounding explanation must be Sinhala script.

Example:

User:
නාඩු මිල කීයද?

Good answer:
PMB එකේ නාඩු වී සඳහා අදාළ මිල දැනට ලබා දී ඇති PMB දත්ත අනුව පැහැදිලි කළ හැක.

User:
මෝල්කරුට මගේ අවම මිල පේනවද?

Good answer:
නැහැ. ගොවියාගේ අවම පිළිගත හැකි මිල පෞද්ගලික තොරතුරක් වන අතර එය මෝල්කරුට පෙන්වන්නේ නැහැ.
"""


    # ======================================================
    # SINGLISH INPUT
    # ======================================================

    if language_style == "singlish":

        return """
The user asked the question in Singlish.

IMPORTANT:

Singlish is ONLY the user's input style.

The answer MUST be written in SINHALA SCRIPT.

Do NOT answer in Singlish.

Do NOT transliterate Sinhala into English letters.

Use natural, simple, farmer-friendly Sri Lankan Sinhala.

You may keep commonly used technical marketplace terms in English
where appropriate, such as:

PMB
AI
FL
WhatsApp
Digital Goviya
matching
negotiation
Harvest
Demand

But the main explanation MUST be in Sinhala script.

Examples:

User:
Nadu mila kiiyada?

Correct answer:
2025/26 මහ කන්නය සඳහා PMB එකේ නාඩු වී මිල කිලෝග්‍රෑමයකට රු. 120.00ක් වේ.

User:
Miller ta mage awama mila penawada?

Correct answer:
නැහැ. ගොවියාගේ අවම පිළිගත හැකි මිල පෞද්ගලික තොරතුරක්. එය මෝල්කරුට පෙන්වන්නේ නැහැ.

User:
Miller kenekta connect wenne kohomada?

Correct answer:
මෝල්කරුවෙකු සමඟ සම්බන්ධ වීමට ඔහුට connection request එකක් යවන්න. ඔහු එය පිළිගත් පසු ඔබගේ connection එක සක්‍රීය වේ.

The user's use of English letters MUST NOT cause the answer
to be written in English letters.
"""


    # ======================================================
    # ENGLISH INPUT
    # ======================================================

    return """
The user asked the question in English.

ANSWER MUST BE IN CLEAR, SIMPLE ENGLISH.

Do not switch to Sinhala.

Do not switch to Singlish.

Keep technical marketplace terms such as PMB, AI, FL,
matching, negotiation, Harvest and Demand where appropriate.
"""


# ==========================================================
# GPT ANSWER
# ==========================================================

def ask_gpt(
    query,
    normalized_query,
    intent,
    language_style,
    context,
    personalized_context,
):

    language_instruction = (
        build_language_instruction(
            language_style
        )
    )

    system_prompt = """
You are the Digital Goviya AI Marketplace Assistant.

You support Farmers and Millers in the Sri Lankan paddy marketplace.

Your allowed scope is:

- Paddy Marketing Board purchasing information
- PMB purchasing prices contained in the supplied official knowledge
- PMB quality requirements
- PMB purchasing procedures
- Digital Goviya marketplace usage
- Harvests and Miller Demands
- AI matching
- Marketplace connections and partners
- AI negotiation
- Federated Learning price-reference explanations
- Marketplace privacy and contact-sharing rules

You are NOT a general farming assistant.

Do not provide:

- cultivation instructions
- fertilizer plans
- crop disease treatment
- weather advice
- unrelated agricultural advice

==========================================================
GROUNDING RULES
==========================================================

1. Use only the supplied retrieved context for factual claims.

2. Do not invent PMB rules, prices, dates, marketplace functions
   or policies.

3. If the required information is not available in the context,
   clearly say that the available marketplace knowledge does not
   contain enough information.

4. Never claim that a Farmer's private minimum acceptable price
   is visible to a Miller.

5. Never claim that a Miller's private maximum buying price
   is visible to a Farmer.

6. Do not ask the user to reveal private negotiation limits.

7. Clearly distinguish the FL/AI predicted reference price from
   an official PMB purchasing price.

8. Keep answers concise and understandable.

9. When an answer comes from PMB knowledge, mention PMB naturally.

10. Never expose internal source IDs to the user.

==========================================================
LANGUAGE RULE
==========================================================

There are three possible input styles:

1. English
2. Sinhala script
3. Singlish

IMPORTANT:

Sinhala script input -> Sinhala script answer.

Singlish input -> Sinhala script answer.

English input -> English answer.

Singlish is an INPUT STYLE, not an OUTPUT LANGUAGE.

The user's use of English letters for Sinhala must NEVER force
the answer into English letters.

Always follow the explicit language instruction supplied below.


==========================================================
PERSONALIZED USER CONTEXT RULES
==========================================================

The application may provide safe personalized marketplace
context for the authenticated user.

This context may contain:
A farmer receives only farmer-related records.
A miller receives only miller-related records.

Never infer that the authenticated user owns or has access to
another user's records.

Use this information ONLY when it is relevant to the user's
question.

The personalized context is different from the official
knowledge retrieved from FAISS.

FAISS knowledge is used for marketplace rules, PMB information,
procedures and general marketplace explanations.

Personalized context is used for information about the current
authenticated user's own marketplace records.

Never invent a personal record.

Never assume that a missing record exists.

Never expose private negotiation limits.

Never reveal:

- minimumAcceptablePrice
- maximumBuyingPrice

Do not ask the user to provide those private values.

If the user's question requires information that is not available
in either the retrieved knowledge or the personalized context,
say that the available information is insufficient.

Do not expose internal implementation details.
"""




    user_prompt = f"""
Detected input language style:
{language_style}

Original user question:
{query}

Normalized marketplace meaning:
{normalized_query}

Detected intent:
{intent}

==========================================================
MANDATORY ANSWER LANGUAGE INSTRUCTION
==========================================================

{language_instruction}

==========================================================
RETRIEVED MARKETPLACE KNOWLEDGE
==========================================================

{context}

==========================================================
PERSONALIZED MARKETPLACE CONTEXT
==========================================================

{personalized_context}

==========================================================
FINAL INSTRUCTIONS
==========================================================

Answer the ORIGINAL user question directly.

Use only the supplied marketplace knowledge for factual claims.

Do not show the normalized query.

Do not expose internal source IDs.

Do not provide a separate source list because the application
will display source cards below the answer.

Most importantly:

If input is Sinhala script:
    answer in Sinhala script.

If input is Singlish:
    answer in Sinhala script.

If input is English:
    answer in English.

Do not mention these language rules in your answer.
"""

    try:

        response = (
            client
            .chat
            .completions
            .create(
                model="gpt-4.1-mini",

                messages=[
                    {
                        "role":
                            "system",

                        "content":
                            system_prompt,
                    },

                    {
                        "role":
                            "user",

                        "content":
                            user_prompt,
                    },
                ],

                temperature=0.2,
            )
        )

        answer = (
            response
            .choices[0]
            .message
            .content
        )

        return normalize_text(
            answer
        )

    except Exception as error:

        raise RuntimeError(
            f"OpenAI generation failed: {error}"
        )


# ==========================================================
# MAIN RAG FUNCTION
# ==========================================================

def run_rag(
    query,
    user_context=None,
):

    query = normalize_text(
        query
    )

    if not query:

        raise ValueError(
            "Question cannot be empty."
        )

    query_info = (
        build_normalized_query(
            query
        )
    )

    language_style = (
        query_info[
            "languageStyle"
        ]
    )

    normalized_query = (
        query_info[
            "normalizedQuery"
        ]
    )

    # ------------------------------------------------------
    # Intent uses normalized query
    # ------------------------------------------------------

    intent = route_query(
        normalized_query
    )

    # ------------------------------------------------------
    # Retrieval uses both original and normalized query
    # ------------------------------------------------------

    if (
        normalized_query
        != query.lower()
    ):

        retrieval_query = (
            f"{query} "
            f"{normalized_query}"
        )

    else:

        retrieval_query = query

    retrieved = retrieve(
        retrieval_query,
        intent,
    )

    context = build_context(
        retrieved
    )

    personalized_context = (
        build_personalized_context(
            user_context
        )
    )

    sources = build_sources(
        retrieved
    )

    answer = ask_gpt(
        query=query,

        normalized_query=
            normalized_query,

        intent=
            intent,

        language_style=
            language_style,

        context=
            context,

        personalized_context=
            personalized_context,
    )

    return {

        "query":
            query,

        "normalizedQuery":
            normalized_query,

        "languageStyle":
            language_style,

        "intent":
            intent,

        "answer":
            answer,

        "sources":
            sources,

        "suggestedQuestions":
            suggested_questions(
                intent,
                language_style,
            ),

        "results": [

            {
                "id":
                    item[
                        "record"
                    ].get(
                        "id",
                        "",
                    ),

                "title":
                    item[
                        "record"
                    ].get(
                        "title",
                        "",
                    ),

                "content":
                    item[
                        "record"
                    ].get(
                        "content",
                        "",
                    ),

                "score":
                    round(
                        item[
                            "semanticScore"
                        ],
                        4,
                    ),
            }

            for item in retrieved
        ],

        "context":
            context,

        "userContextUsed":
            bool(user_context),
    }


# ==========================================================
# PERSONALIZED USER CONTEXT
# ==========================================================

PRIVATE_CONTEXT_FIELDS = {
    "minimumAcceptablePrice",
    "maximumBuyingPrice",
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
}


def sanitize_user_context(value):
    """
    Defensive privacy filter.

    Phase 2.2 already prevents private negotiation limits from
    being sent to the RAG engine.

    This second layer ensures that even if an unexpected private
    field reaches Python, it will not be included in the GPT
    context.
    """

    if isinstance(value, dict):

        cleaned = {}

        for key, item in value.items():

            if key in PRIVATE_CONTEXT_FIELDS:
                continue

            cleaned[key] = sanitize_user_context(item)

        return cleaned

    if isinstance(value, list):

        return [
            sanitize_user_context(item)
            for item in value
        ]

    return value


def normalize_user_context(user_context):
    """
    Convert the context received from Node.js into a safe,
    predictable structure.
    """

    if not isinstance(user_context, dict):
        return {
            "role": None,
            "profile": {},
            "harvests": [],
            "demands": [],
        }

    sanitized = sanitize_user_context(
        user_context
    )

    return {
        "role": sanitized.get(
            "role"
        ),

        "profile": sanitized.get(
            "profile",
            {},
        ),

        "harvests": sanitized.get(
            "harvests",
            [],
        ),

        "demands": sanitized.get(
            "demands",
            [],
        ),
    }


def build_personalized_context(
    user_context,
):
    """
    Convert the safe Node.js context into a compact prompt
    section for GPT.

    This is NOT part of the FAISS knowledge base.
    """

    context = normalize_user_context(
        user_context
    )

    role = context.get(
        "role"
    )

    profile = context.get(
        "profile",
        {},
    )

    harvests = context.get(
        "harvests",
        [],
    )

    demands = context.get(
        "demands",
        [],
    )

    blocks = []

    blocks.append(
        "CURRENT AUTHENTICATED USER"
    )

    blocks.append(
        f"Role: {role or 'unknown'}"
    )

    if profile:

        blocks.append(
            "Profile:"
        )

        for key, value in profile.items():

            if value in (
                None,
                "",
                [],
                {},
            ):
                continue

            blocks.append(
                f"- {key}: {value}"
            )

    # ------------------------------------------------------
    # FARMER HARVESTS
    # ------------------------------------------------------

    if role == "farmer":

        blocks.append(
            "\nFarmer's marketplace harvests:"
        )

        if not harvests:

            blocks.append(
                "- No harvest records are currently available."
            )

        else:

            for index, harvest in enumerate(
                harvests,
                start=1,
            ):

                blocks.append(
                    f"Harvest {index}:"
                )

                if isinstance(
                    harvest,
                    dict,
                ):

                    for key, value in harvest.items():

                        if value in (
                            None,
                            "",
                            [],
                            {},
                        ):
                            continue

                        if key in PRIVATE_CONTEXT_FIELDS:
                            continue

                        blocks.append(
                            f"- {key}: {value}"
                        )

    # ------------------------------------------------------
    # MILLER DEMANDS
    # ------------------------------------------------------

    if role == "miller":

        blocks.append(
            "\nMiller's marketplace demands:"
        )

        if not demands:

            blocks.append(
                "- No open demand records are currently available."
            )

        else:

            for index, demand in enumerate(
                demands,
                start=1,
            ):

                blocks.append(
                    f"Demand {index}:"
                )

                if isinstance(
                    demand,
                    dict,
                ):

                    for key, value in demand.items():

                        if value in (
                            None,
                            "",
                            [],
                            {},
                        ):
                            continue

                        if key in PRIVATE_CONTEXT_FIELDS:
                            continue

                        blocks.append(
                            f"- {key}: {value}"
                        )

    return "\n".join(
        blocks
    )


# ==========================================================
# COMMAND LINE / STDIN ENTRY
# ==========================================================

def read_input():

    # ======================================================
    # COMMAND-LINE SUPPORT
    #
    # Example:
    #
    # python rag_engine.py "Nadu price kiyada?"
    #
    # Check argv FIRST.
    # Otherwise sys.stdin.read() waits for EOF in PowerShell.
    # ======================================================

    if len(sys.argv) >= 2:

        question = normalize_text(
            sys.argv[1]
        )

        if not question:

            raise ValueError(
                "Question cannot be empty."
            )

        return (
            question,
            {},
        )


    # ======================================================
    # STDIN / NODE.JS SUPPORT
    #
    # Node.js sends:
    #
    # {
    #   "question": "...",
    #   "userContext": {...}
    # }
    #
    # ======================================================

    stdin_data = sys.stdin.read().strip()

    if stdin_data:

        try:

            payload = json.loads(
                stdin_data
            )

            if not isinstance(
                payload,
                dict,
            ):

                raise ValueError(
                    "RAG input must be a JSON object."
                )

            question = normalize_text(
                payload.get(
                    "question",
                    "",
                )
            )

            user_context = (
                payload.get(
                    "userContext",
                    {},
                )
            )

            if not question:

                raise ValueError(
                    "Question cannot be empty."
                )

            return (
                question,
                user_context,
            )

        except json.JSONDecodeError:

            raise ValueError(
                "Invalid JSON input received by the RAG engine."
            )


    raise ValueError(
        "No query provided."
    )


if __name__ == "__main__":

    try:

        question, user_context = (
            read_input()
        )

        output = run_rag(
            question,
            user_context,
        )

        print(
            json.dumps(
                output,
                ensure_ascii=False,
            )
        )

    except Exception as error:

        print(
            json.dumps(
                {
                    "error":
                        str(error),
                },
                ensure_ascii=False,
            )
        )

        sys.exit(1)