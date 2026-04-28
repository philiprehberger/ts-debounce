import type { DebounceAsyncOptions, DebouncedAsyncFunction } from './types.js';
import { DebounceTimeoutError } from './errors.js';

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number,
  options: DebounceAsyncOptions = {}
): DebouncedAsyncFunction<T> {
  const { signal, safetyTimeout } = options;
  const hasSafetyTimeout = typeof safetyTimeout === 'number' && safetyTimeout > 0;

  let timerId: ReturnType<typeof setTimeout> | undefined;
  let safetyTimerId: ReturnType<typeof setTimeout> | undefined;
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

  function clearSafetyTimer(): void {
    if (safetyTimerId !== undefined) {
      clearTimeout(safetyTimerId);
      safetyTimerId = undefined;
    }
  }

  function resetState(): void {
    lastArgs = undefined;
    lastThis = undefined;
    pendingResolve = undefined;
    pendingReject = undefined;
    pendingPromise = undefined;
  }

  function cancel(): void {
    clearTimer();
    clearSafetyTimer();

    if (pendingReject) {
      pendingReject(new DOMException('Debounced call was cancelled', 'AbortError'));
    }

    resetState();
  }

  function safetyTimeoutExpired(): void {
    clearTimer();
    clearSafetyTimer();

    if (pendingReject) {
      pendingReject(new DebounceTimeoutError(safetyTimeout!));
    }

    resetState();
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

      // Start safety timer once per pending cycle (not reset on every call).
      if (hasSafetyTimeout) {
        safetyTimerId = setTimeout(safetyTimeoutExpired, safetyTimeout);
      }
    }

    const currentPromise = pendingPromise;

    timerId = setTimeout(async () => {
      timerId = undefined;
      clearSafetyTimer();
      const resolve = pendingResolve!;
      const reject = pendingReject!;
      const callArgs = lastArgs!;
      const callThis = lastThis;

      resetState();

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
