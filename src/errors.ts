/**
 * Error thrown when a debounced async invocation is auto-cancelled because
 * the configured `safetyTimeout` elapsed before the function could resolve.
 *
 * The `name` is `DebounceTimeoutError` so callers can branch on either
 * `instanceof DebounceTimeoutError` or `error.name === 'DebounceTimeoutError'`.
 */
export class DebounceTimeoutError extends Error {
  public readonly timeout: number;

  constructor(timeout: number, message?: string) {
    super(message ?? `Debounced call exceeded safetyTimeout of ${timeout}ms`);
    this.name = 'DebounceTimeoutError';
    this.timeout = timeout;
    // Preserve the prototype chain when transpiled to ES5/CJS.
    Object.setPrototypeOf(this, DebounceTimeoutError.prototype);
  }
}
