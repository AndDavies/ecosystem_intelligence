import "server-only";

const transientPatterns = [
  /fetch failed/i,
  /network/i,
  /timeout/i,
  /current transaction is aborted/i,
  /terminated/i,
  /econnreset/i,
  /522|523|524|525/
];

export function isTransientPublicReadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return transientPatterns.some((pattern) => pattern.test(message));
}

type PublicReadRetryOptions = {
  baseDelayMs?: number;
  jitterMs?: number;
  random?: () => number;
};

function retryDelay(options: number | PublicReadRetryOptions) {
  if (typeof options === "number") return Math.max(0, options);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 200);
  const jitterMs = Math.max(0, options.jitterMs ?? 300);
  const random = options.random ?? Math.random;
  return baseDelayMs + Math.floor(random() * jitterMs);
}

export async function withPublicReadRetry<T>(
  operation: () => Promise<T>,
  options: number | PublicReadRetryOptions = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientPublicReadError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, retryDelay(options)));
    return operation();
  }
}

/** A transient read may reuse a recent success; schema/auth failures never do. */
export function createPublicReadFallback<T>(maxAgeMs = 5 * 60 * 1000) {
  let lastGood: {value:T; receivedAt:number}|null=null;
  return async (read:()=>Promise<T>):Promise<T> => {
    try {
      const value=await read();
      lastGood={value,receivedAt:Date.now()};
      return value;
    } catch (error) {
      if (!isTransientPublicReadError(error) || !lastGood || Date.now()-lastGood.receivedAt >= maxAgeMs) {
        lastGood=null;
        throw error;
      }
      return lastGood.value;
    }
  };
}
