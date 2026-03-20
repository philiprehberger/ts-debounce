import { debounce } from './debounce.js';
import type { DebounceOptions, ThrottledFunction } from './types.js';

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: Omit<DebounceOptions, 'maxWait'>
): ThrottledFunction<T> {
  return debounce(fn, wait, {
    leading: true,
    trailing: true,
    ...options,
    maxWait: wait,
  });
}
