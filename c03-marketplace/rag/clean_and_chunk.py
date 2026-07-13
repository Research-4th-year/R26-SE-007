import re

input_path = "../data/circular_clean.txt"
output_path = "../data/circular_chunks.txt"

with open(input_path, "r", encoding="utf-8") as f:
    text = f.read()

# Basic cleaning
text = re.sub(r'\n+', '\n', text)   # remove extra new lines
text = re.sub(r'\s+', ' ', text)    # normalize spaces

# Split into chunks (important for RAG)
chunks = []
chunk_size = 300  # characters

for i in range(0, len(text), chunk_size):
    chunk = text[i:i+chunk_size]
    chunks.append(chunk)

# Save
with open(output_path, "w", encoding="utf-8") as f:
    for c in chunks:
        f.write(c.strip() + "\n")

print("Cleaned & chunked successfully")