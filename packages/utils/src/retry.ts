export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  exponential = true,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await sleep(delay);
    return retryWithBackoff(
      fn,
      retries - 1,
      exponential ? delay * 2 : delay,
      exponential,
    );
  }
};
