function str(name, fallback = "") {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return String(value);
}

function int(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function positiveInt(name, fallback) {
  const value = int(name, fallback);
  return value > 0 ? value : fallback;
}

function bool(name, fallback = false) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function csv(name, fallback = []) {
  const value = str(name, "");
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  bool,
  csv,
  int,
  positiveInt,
  str,
};
