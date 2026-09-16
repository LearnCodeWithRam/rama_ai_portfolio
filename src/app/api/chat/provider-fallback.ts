type ErrorLike = {
  statusCode?: unknown;
  lastError?: unknown;
  responseHeaders?: Record<string, string>;
  message?: unknown;
  name?: unknown;
};

function asErrorLike(error: unknown): ErrorLike {
  return error != null && typeof error === 'object' ? error as ErrorLike : {};
}

function unwrapError(error: unknown): unknown {
  return asErrorLike(error).lastError ?? error;
}

function safeMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  const message = asErrorLike(error).message;
  return typeof message === 'string' ? message : String(error);
}

export function shouldUseFallback(error: unknown): boolean {
  const status = asErrorLike(unwrapError(error)).statusCode;
  if (typeof status === 'number' && (status === 401 || status === 403 || status === 404 || status === 429 || status >= 500)) {
    return true;
  }

  const message = safeMessage(error).toLowerCase();
  return ['timeout', 'fetch failed', 'network', 'overloaded', 'rate limit', 'too many requests', 'service unavailable', 'thought_signature']
    .some(term => message.includes(term));
}

export function logProviderError(provider: string, model: string, error: unknown): void {
  const status = asErrorLike(unwrapError(error)).statusCode;
  console.warn(
    `[CHAT-API] provider=${provider} model=${model} status=${typeof status === 'number' ? status : 'n/a'} ` +
    `message=${safeMessage(error).slice(0, 160)}`
  );
}

export const SAFE_CHAT_ERROR = 'AI service is temporarily unavailable. Please try again later.';