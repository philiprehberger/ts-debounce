export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
  signal?: AbortSignal;
}

export interface DebounceAsyncOptions {
  signal?: AbortSignal;
  /**
   * Maximum time (ms) a pending invocation may stay pending before it is
   * auto-cancelled with a `DebounceTimeoutError`. Acts as a safety guarantee
   * for callers that must not wait indefinitely while calls keep arriving.
   */
  safetyTimeout?: number;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
  readonly pending: boolean;
}

export interface ThrottledFunction<T extends (...args: any[]) => any> extends DebouncedFunction<T> {}

export interface DebouncedAsyncFunction<T extends (...args: any[]) => Promise<any>> {
  (...args: Parameters<T>): ReturnType<T>;
  cancel(): void;
  readonly pending: boolean;
}
