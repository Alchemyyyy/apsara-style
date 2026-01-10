import sys, json
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

def main():
    model = SentenceTransformer(MODEL_NAME)
    raw = sys.stdin.read()
    data = json.loads(raw)
    text = data.get("text", "")
    vec = model.encode([text], normalize_embeddings=True)[0].tolist()
    sys.stdout.write(json.dumps(vec))

if __name__ == "__main__":
    main()
