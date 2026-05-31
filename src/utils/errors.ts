export function isTelegramError(error: unknown): error is { description: string; error_code: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'description' in error &&
    'error_code' in error
  );
}

export function isQueryTooOldError(error: unknown): boolean {
  return isTelegramError(error) && error.description.includes('query is too old');
}

export function isMessageNotModifiedError(error: unknown): boolean {
  return (
    isTelegramError(error) &&
    error.description.includes('message is not modified')
  );
}

export function logError(context: string, error: unknown) {
  if (isTelegramError(error)) {
    console.error(`[${context}] Telegram Error ${error.error_code}: ${error.description}`);
  } else if (error instanceof Error) {
    console.error(`[${context}] ${error.message}`);
  } else {
    console.error(`[${context}] Unknown error:`, error);
  }
}
