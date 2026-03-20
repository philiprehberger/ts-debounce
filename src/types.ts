export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
  signal?: AbortSignal;
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
