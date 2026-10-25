export interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

export const logger = {
  info(message: string, context?: LogContext) {
    const entry = {
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.log(JSON.stringify(entry));
  },
  warn(message: string, context?: LogContext) {
    const entry = {
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    };
    console.warn(JSON.stringify(entry));
  },
  error(message: string, error?: unknown, context?: LogContext) {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
    const errorStack = error instanceof Error ? error.stack : undefined;
    const entry = {
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      errorMessage,
      errorStack,
      ...context,
    };
    console.error(JSON.stringify(entry));
  },
};
