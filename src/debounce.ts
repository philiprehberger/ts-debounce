import type { DebounceOptions, DebouncedFunction } from './types.js';

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait, signal } = options;

  let timerId: ReturnType<typeof setTimeout> | undefined;
  let maxTimerId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const hasMaxWait = maxWait !== undefined;

  function invokeFunc(time: number): ReturnType<T> | undefined {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args!) as ReturnType<T>;
    return result;
  }

  function startTimer(pendingFunc: () => void, waitMs: number): ReturnType<typeof setTimeout> {
    return setTimeout(pendingFunc, waitMs);
  }

  function cancelTimer(): void {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    if (maxTimerId !== undefined) {
      clearTimeout(maxTimerId);
      maxTimerId = undefined;
    }
  }

  function leadingEdge(time: number): ReturnType<T> | undefined {
    lastInvokeTime = time;

    timerId = startTimer(timerExpired, wait);

    if (hasMaxWait) {
      maxTimerId = startTimer(maxWaitExpired, maxWait);
    }

    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeWaiting = wait - timeSinceLastCall;

    if (hasMaxWait) {
      const timeSinceLastInvoke = time - lastInvokeTime;
      const maxRemaining = maxWait - timeSinceLastInvoke;
      return Math.min(timeWaiting, maxRemaining);
    }

    return timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    if (lastCallTime === undefined) return true;

    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (hasMaxWait && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): void {
    const time = Date.now();

    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }

    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function maxWaitExpired(): void {
    const time = Date.now();
    cancelTimer();

    if (trailing && lastArgs) {
      invokeFunc(time);
    }

    lastArgs = undefined;
    lastThis = undefined;
    lastCallTime = undefined;
  }

  function trailingEdge(time: number): void {
    timerId = undefined;
    cancelTimer();

    if (trailing && lastArgs) {
      invokeFunc(time);
    }

    lastArgs = undefined;
    lastThis = undefined;
  }

  function cancel(): void {
    cancelTimer();
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastThis = undefined;
    lastCallTime = undefined;
  }

  function flush(): ReturnType<T> | undefined {
    if (timerId === undefined && maxTimerId === undefined) {
      return result;
    }

    const time = Date.now();
    cancelTimer();

    if (lastArgs) {
      return invokeFunc(time);
    }

    return result;
  }

  function isPending(): boolean {
    return timerId !== undefined || maxTimerId !== undefined;
  }

  const debounced = function (this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(time);
      }

      if (hasMaxWait) {
        cancelTimer();
        timerId = startTimer(timerExpired, wait);
        if (hasMaxWait) {
          maxTimerId = startTimer(maxWaitExpired, maxWait);
        }
        return leading ? invokeFunc(time) : result;
      }
    }

    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait);
      if (hasMaxWait) {
        maxTimerId = startTimer(maxWaitExpired, maxWait);
      }
    }

    return result;
  } as DebouncedFunction<T>;

  Object.defineProperties(debounced, {
    cancel: { value: cancel, writable: false },
    flush: { value: flush, writable: false },
    pending: { get: isPending },
  });

  if (signal) {
    signal.addEventListener('abort', cancel, { once: true });
  }

  return debounced;
}
