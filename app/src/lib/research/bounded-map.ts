export async function boundedMap<T, Result>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<Result>
) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive integer.");
  }
  if (values.length === 0) return [];

  const results = new Array<Result>(values.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

export async function boundedMapByKey<T, Result>(
  values: readonly T[],
  concurrency: number,
  keyFor: (value: T, index: number) => string,
  mapper: (value: T, index: number) => Promise<Result>
) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive integer.");
  }
  if (values.length === 0) return [];

  const results = new Array<Result>(values.length);
  const pending = new Set(values.map((_, index) => index));
  const activeKeys = new Set<string>();
  let waiters: Array<() => void> = [];

  const notify = () => {
    const current = waiters;
    waiters = [];
    current.forEach((resolve) => resolve());
  };
  const take = async (): Promise<{ index: number; key: string } | undefined> => {
    while (pending.size > 0) {
      for (const index of pending) {
        const key = keyFor(values[index], index);
        if (activeKeys.has(key)) continue;
        pending.delete(index);
        activeKeys.add(key);
        return { index, key };
      }
      await new Promise<void>((resolve) => waiters.push(resolve));
    }
    return undefined;
  };
  const worker = async () => {
    while (true) {
      const item = await take();
      if (!item) return;
      try {
        results[item.index] = await mapper(values[item.index], item.index);
      } finally {
        activeKeys.delete(item.key);
        notify();
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}
