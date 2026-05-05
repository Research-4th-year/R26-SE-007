import pdfplumber

pdf_path = "../data/paddy_circular.pdf"
output_path = "../data/circular_clean.txt"

all_text = []

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            all_text.append(text)

full_text = "\n".join(all_text)

with open(output_path, "w", encoding="utf-8") as f:
    f.write(full_text)

print("PDF converted to text successfully")