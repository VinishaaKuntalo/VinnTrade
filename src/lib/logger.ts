type LogLevel = "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

function emit(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) {
  const logFn = level === "info" ? console.log : console[level];
  const base = { ts: new Date().toISOString(), level, message, ...meta };
  if (isProd) {
    logFn.call(console, JSON.stringify(base));
  } else {
    logFn.call(console, `[${level}] ${message}`, meta ? meta : "");
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    emit("error", message, meta),
};
