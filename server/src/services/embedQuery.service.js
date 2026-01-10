const { spawn } = require("child_process");

function embedQueryPython(text) {
  return new Promise((resolve, reject) => {
    const p = spawn("bash", ["-lc", `source .venv/bin/activate && python scripts/embed_query.py`], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let out = "";
    let err = "";

    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));

    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(err || `embed_query.py exited ${code}`));
      try {
        const vec = JSON.parse(out);
        resolve(vec);
      } catch (e) {
        reject(new Error("Failed to parse embedding output: " + e.message));
      }
    });

    p.stdin.write(JSON.stringify({ text }));
    p.stdin.end();
  });
}

module.exports = { embedQueryPython };
