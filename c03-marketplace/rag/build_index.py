import json
import os
import sys
import warnings

warnings.filterwarnings("ignore")
os.environ["TOKENIZERS_PARALLELISM"] = "false"

old_stderr = sys.stderr
sys.stderr = open(os.devnull, "w")

try:
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer
finally:
    sys.stderr = old_stderr


# ==========================================================
# PATHS
# ==========================================================

CURRENT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

KNOWLEDGE_DIR = os.path.join(
    CURRENT_DIR,
    "knowledge",
)

INDEX_DIR = os.path.join(
    CURRENT_DIR,
    "indexes",
)

PMB_FILE = os.path.join(
    KNOWLEDGE_DIR,
    "pmb_knowledge.json",
)

MARKETPLACE_FILE = os.path.join(
    KNOWLEDGE_DIR,
    "marketplace_knowledge.json",
)

INDEX_FILE = os.path.join(
    INDEX_DIR,
    "marketplace_knowledge.faiss",
)

METADATA_FILE = os.path.join(
    INDEX_DIR,
    "marketplace_metadata.json",
)


# ==========================================================
# EMBEDDING MODEL
# ==========================================================

MODEL_NAME = (
    "sentence-transformers/"
    "paraphrase-multilingual-MiniLM-L12-v2"
)


# ==========================================================
# LOAD JSON
# ==========================================================

def load_json(path):
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Knowledge file not found: {path}"
        )

    with open(
        path,
        "r",
        encoding="utf-8",
    ) as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError(
            f"Knowledge file must contain a JSON array: {path}"
        )

    return data


# ==========================================================
# VALIDATE KNOWLEDGE RECORD
# ==========================================================

def validate_record(record):
    required = [
        "id",
        "category",
        "title",
        "organization",
        "content",
    ]

    missing = [
        field
        for field in required
        if not record.get(field)
    ]

    if missing:
        raise ValueError(
            f"Record {record.get('id', 'UNKNOWN')} "
            f"is missing fields: {missing}"
        )


# ==========================================================
# BUILD SEARCHABLE TEXT
# ==========================================================

def build_embedding_text(record):
    parts = [
        f"Title: {record.get('title', '')}",
        f"Category: {record.get('category', '')}",
        f"Organization: {record.get('organization', '')}",
        f"Section: {record.get('section', '')}",
        f"Year: {record.get('year', '')}",
        f"Season: {record.get('season', '')}",
        f"Paddy type: {record.get('paddyType', '')}",
        f"Content: {record.get('content', '')}",
    ]

    keywords = record.get(
        "keywords",
        [],
    )

    if keywords:
        parts.append(
            "Keywords: "
            + ", ".join(keywords)
        )

    return "\n".join(
        part
        for part in parts
        if part.split(
            ":",
            1,
        )[-1].strip()
    )


# ==========================================================
# MAIN
# ==========================================================

def main():
    print(
        "Loading marketplace RAG knowledge..."
    )

    pmb_records = load_json(
        PMB_FILE
    )

    marketplace_records = load_json(
        MARKETPLACE_FILE
    )

    records = (
        pmb_records
        + marketplace_records
    )

    if not records:
        raise ValueError(
            "No knowledge records were found."
        )

    for record in records:
        validate_record(
            record
        )

    searchable_texts = [
        build_embedding_text(
            record
        )
        for record in records
    ]

    print(
        f"Loaded {len(records)} knowledge records."
    )

    print(
        f"Loading embedding model: {MODEL_NAME}"
    )

    sys.stderr = open(
        os.devnull,
        "w",
    )

    try:
        model = SentenceTransformer(
            MODEL_NAME
        )
    finally:
        sys.stderr = old_stderr

    print(
        "Creating embeddings..."
    )

    embeddings = model.encode(
        searchable_texts,
        convert_to_numpy=True,
        show_progress_bar=True,
    )

    embeddings = np.asarray(
        embeddings,
        dtype="float32",
    )

    # Normalize vectors so inner product
    # behaves like cosine similarity.
    faiss.normalize_L2(
        embeddings
    )

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatIP(
        dimension
    )

    index.add(
        embeddings
    )

    os.makedirs(
        INDEX_DIR,
        exist_ok=True,
    )

    faiss.write_index(
        index,
        INDEX_FILE,
    )

    metadata = []

    for position, record in enumerate(
        records
    ):
        metadata.append(
            {
                "index": position,
                **record,
                "embeddingText":
                    searchable_texts[
                        position
                    ],
            }
        )

    with open(
        METADATA_FILE,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            metadata,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print()
    print(
        "RAG knowledge index built successfully."
    )
    print(
        f"Index: {INDEX_FILE}"
    )
    print(
        f"Metadata: {METADATA_FILE}"
    )


if __name__ == "__main__":
    main()