from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pandas as pd
from openai import OpenAI

client = OpenAI()

# ---------------------------
# LOAD MODEL
# ---------------------------
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# ---------------------------
# LOAD DATA
# ---------------------------
prices_df = pd.read_csv("../data/paddy_prices.csv")
farmers_df = pd.read_csv("../data/farmers.csv")
millers_df = pd.read_csv("../data/millers.csv")

with open("../data/circular.txt", "r", encoding="utf-8") as f:
    circular_docs = [line.strip() for line in f.readlines() if line.strip()]

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
    f"Miller {row['mill_name']} in {row['district']} | Location {row['location']}"
    for _, row in millers_df.iterrows()
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
    else:
        return "general"

# ---------------------------
# SEARCH
# ---------------------------
def search(index, docs, query, k=5):
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
Answer shortly (max 5 lines).
Give:
- Price
- Recommendation

Context:
{context}

Question:
{query}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "Answer short. Sinhala + English."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    return response.choices[0].message.content

# ---------------------------
# MAIN
# ---------------------------
query = input("Ask question: ")

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

context = "\n".join(results[:5])

print("\n Filtered Results:\n")
for r in results[:5]:
    print("-", r)


answer = ask_gpt(query, context)
print("\nAI Answer:\n", answer)