import "server-only";

const transientPatterns = [
  /fetch failed/i,
  /network/i,
  /timeout/i,
  /terminated/i,
  /econnreset/i,
  /522|523|524|525/
];

export function isTransientPublicReadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return transientPatterns.some((pattern) => pattern.test(message));
}

export async function withPublicReadRetry<T>(operation: () => Promise<T>, delayMs = 125): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientPublicReadError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return operation();
  }
}
