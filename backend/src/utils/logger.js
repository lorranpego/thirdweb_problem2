const formatMeta = (meta = {}) => {
  const safeMeta = {};
  Object.keys(meta).forEach((key) => {
    const value = meta[key];
    if (value !== undefined) {
      safeMeta[key] = value;
    }
  });
  return safeMeta;
};

const log = (level, message, meta = {}) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...formatMeta(meta),
  };
  const output = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(output);
    return;
  }
  console.log(output);
};

const logger = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
};

module.exports = { logger };
