// A simple structured JSON logger for Supabase Edge Functions
export function logInfo(message: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", message, ...data, timestamp: new Date().toISOString() }));
}

export function logError(message: string, error?: unknown, context: Record<string, unknown> = {}) {
  const errDetails =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error };

  console.error(JSON.stringify({ level: "error", message, ...context, ...errDetails, timestamp: new Date().toISOString() }));
}
