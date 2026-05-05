import sys
import json
import os
import warnings

# Suppress warnings to prevent them from interfering with JSON output
warnings.filterwarnings("ignore")
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Redirect stderr so huggingface/transformers logs don't pollute stdout
old_stderr = sys.stderr
sys.stderr = open(os.devnull, 'w')

try:
    from sentence_transformers import SentenceTransformer
    import faiss
    import numpy as np
    import pandas as pd
    from openai import OpenAI
    from pymongo import MongoClient
    import os

finally:
    # Restore stderr after imports
    sys.stderr = old_stderr

client = OpenAI()


# Connect Python RAG with MongoDB
mongo_uri = os.getenv("MONGO_URI")
mongo_client = MongoClient(mongo_uri)

db = mongo_client["paddy_marketplace"]
millers_collection = db["millers"]

millers_data = list(millers_collection.find())


# ---------------------------
# LOAD MODEL
# ---------------------------
# Keep stderr suppressed during model load as well if it outputs logs
sys.stderr = open(os.devnull, 'w')
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
sys.stderr = old_stderr

# ---------------------------
# LOAD DATA
# ---------------------------
# Using relative paths from the script's directory
current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, "../data")

prices_df = pd.read_csv(os.path.join(data_dir, "paddy_prices.csv"))
farmers_df = pd.read_csv(os.path.join(data_dir, "farmers.csv"))
millers_df = pd.read_csv(os.path.join(data_dir, "millers.csv"))

with open(os.path.join(data_dir, "circular_chunks.txt"), "r", encoding="utf-8") as f:
    text = f.read()

# Split by paragraphs (better)
circular_docs = [chunk.strip() for chunk in text.split("\n\n") if chunk.strip()]

# ---------------------------
# CONVERT TO TEXT
# ---------------------------
price_docs = [
    f"{row['type']} | {row['year']} | {row['season']} | Rs.{row['price']}"
    for _, row in prices_df.iterrows()
]

farmer_docs = [
    f"Farmer in {row['district']} selling {row['type']} | {row['quantity']}kg | Expected Rs.{row['expected_price']}"
    for _, row in farmers_df.iterrows()
]

miller_docs = [
    f"Miller Name: {m.get('name','')} | Mill: {m.get('mill_name','')} | Location: {m.get('location','')} | District: {m.get('district','')}"
    for m in millers_data
]

# ---------------------------
# CREATE INDEX FUNCTION
# ---------------------------
def create_index(docs):
    embeddings = model.encode(docs)
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings))
    return index, docs

price_index, price_docs = create_index(price_docs)
farmer_index, farmer_docs = create_index(farmer_docs)
miller_index, miller_docs = create_index(miller_docs)
circular_index, circular_docs = create_index(circular_docs)

# ---------------------------
# ROUTER
# ---------------------------
def route_query(query):
    q = query.lower()
    if "price" in q:
        return "price"
    elif "farmer" in q:
        return "farmer"
    elif "who" in q or "buyer" in q or "miller" in q:
        return "miller"
    elif "circular" in q or "rule" in q or "නියම" in q or "පාලන" in q:
        return "circular"
    else:
        return "general"


def keyword_filter(docs, query):
    q_words = query.lower().split()

    filtered = []
    for d in docs:
        d_lower = d.lower()
        match_score = sum(1 for word in q_words if word in d_lower)

        # Keep only relevant chunks
        if match_score >= 2:
            filtered.append((match_score, d))

    # Sort by best match
    filtered.sort(reverse=True, key=lambda x: x[0])

    return [d for _, d in filtered] if filtered else docs     

# ---------------------------
# SEARCH
# ---------------------------
def search(index, docs, query, k=20):
    query_embedding = model.encode([query])
    D, I = index.search(np.array(query_embedding), k)
    return [docs[i] for i in I[0]]
    

# ---------------------------
# FILTERS
# ---------------------------
def filter_location(results, query):
    if "ampara" in query.lower():
        return [r for r in results if "ampara" in r.lower()] or results
    return results

def prioritize_recent(results):
    def score(r):
        if "2026" in r: return 5
        if "2025" in r: return 4
        if "2024" in r: return 3
        return 1
    return sorted(results, key=score, reverse=True)

# ---------------------------
# GPT
# ---------------------------
def ask_gpt(query, context):
    prompt = f"""
You are an intelligent Sri Lankan agricultural market assistant helping farmers.

Your job:
- Understand the user's question type
- Answer ONLY what is asked (do NOT add extra info)
- Use the given context ONLY (do not invent data)

Language Rules:
- If question is in English → answer in English
- If question is in Sinhala → answer in Sinhala
- If question is in Singlish (roman Sinhala) → answer in Sinhala

Style:
- Friendly, natural, like talking to a farmer
- Not bullet points
- Not robotic
- Clear and helpful

Rules:
- If asking about miller → give mill name + location
- If asking about price → give price + simple advice
- If asking about recommendation → give advice
- If data not found → say clearly it's not available

EXAMPLES:

Q: කිරි සම්බා මිල කීයද?
A: 2025/26 මහ කන්නයට අනුව කිරි සම්බා සඳහා රජයේ සහතික මිල රු.140ක් වේ.

Q: Who is TEST USER?
A: TEST USER කියන වී මෝල්කරු නාමය TEST Mill වන අතර ඔහු Uhana, Ampara ප්‍රදේශයේ සිටී.

Context:
{context}

Question:
{query}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are a smart Sri Lankan farming assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI error: {str(e)}"


# ---------------------------
# MAIN
# ---------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided"}))
        sys.exit(1)

    query = sys.argv[1]
    
    q_type = route_query(query)

    if q_type == "price":
        results = search(price_index, price_docs, query)
    elif q_type == "farmer":
        results = search(farmer_index, farmer_docs, query)
    elif q_type == "miller":
        results = search(miller_index, miller_docs, query)
    else:
        results = search(circular_index, circular_docs, query)

    results = filter_location(results, query)
    results = prioritize_recent(results)
    results = keyword_filter(results, query)


    top_results = results[:5]
    context = "\n".join(top_results)
    
    # Generate the AI answer 
    answer = ask_gpt(query, context)

    # Format output as strictly JSON
    output = {
        "query": query,
        "results": results[:5],
        "context": context,
        "answer": answer
    }
    
    print(json.dumps(output))
