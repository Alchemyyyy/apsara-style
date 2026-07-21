const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let extractorPromise = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import("@xenova/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", MODEL_NAME)
    );
  }
  return extractorPromise;
}

async function embedQueryPython(text) {
  const extractor = await getExtractor();
  const output = await extractor(String(text || ""), { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

module.exports = { embedQueryPython };
