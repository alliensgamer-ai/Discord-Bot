type LogDetails = Record<string, unknown> | undefined;

function write(level: string, message: string, details?: LogDetails) {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}${suffix}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  info: (message: string, details?: LogDetails) => write("info", message, details),
  warn: (message: string, details?: LogDetails) => write("warn", message, details),
  error: (message: string, details?: LogDetails) => write("error", message, details),
};