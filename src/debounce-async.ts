import type { DebounceOptions, DebouncedAsyncFunction } from './types.js';

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number,
  options: Omit<DebounceOptions, 'leading' | 'trailing'> = {}
): DebouncedAsyncFunction<T> {
  const { signal } = options;

  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let pendingResolve: ((value: any) => void) | undefined;
  let pendingReject: ((reason?: any) => void) | undefined;
  let pendingPromise: ReturnType<T> | undefined;

  function clearTimer(): void {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  }

  function cancel(): void {
    clearTimer();

    if (pendingReject) {
      pendingReject(new DOMException('Debounced call was cancelled', 'AbortError'));
    }

    lastArgs = undefined;
    lastThis = undefined;
    pendingResolve = undefined;
    pendingReject = undefined;
    pendingPromise = undefined;
  }

  function isPending(): boolean {
    return timerId !== undefined;
  }

  const debounced = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    lastArgs = args;
    lastThis = this;

    clearTimer();

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        pendingResolve = resolve;
        pendingReject = reject;
      }) as ReturnType<T>;
    }

    const currentPromise = pendingPromise;

    timerId = setTimeout(async () => {
      timerId = undefined;
      const resolve = pendingResolve!;
      const reject = pendingReject!;
      const callArgs = lastArgs!;
      const callThis = lastThis;

      lastArgs = undefined;
      lastThis = undefined;
      pendingResolve = undefined;
      pendingReject = undefined;
      pendingPromise = undefined;

      try {
        const result = await fn.apply(callThis, callArgs);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, wait);

    return currentPromise;
  } as DebouncedAsyncFunction<T>;

  Object.defineProperties(debounced, {
    cancel: { value: cancel, writable: false },
    pending: { get: isPending },
  });

  if (signal) {
    signal.addEventListener('abort', cancel, { once: true });
  }

  return debounced;
}
