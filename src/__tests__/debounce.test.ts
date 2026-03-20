import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { debounce, throttle, debounceAsync } from '../../dist/index.js';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('debounce', () => {
  it('should delay invocation until after wait', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 50);

    fn();
    fn();
    fn();

    assert.strictEqual(callCount, 0);
    await delay(80);
    assert.strictEqual(callCount, 1);
  });

  it('should invoke on leading edge when leading is true', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 50, { leading: true, trailing: false });

    fn();
    assert.strictEqual(callCount, 1);

    fn();
    assert.strictEqual(callCount, 1);

    await delay(80);
    assert.strictEqual(callCount, 1);
  });

  it('should invoke on both leading and trailing edge', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 50, { leading: true, trailing: true });

    fn();
    assert.strictEqual(callCount, 1);

    fn();
    await delay(80);
    assert.strictEqual(callCount, 2);
  });

  it('should cancel pending invocation', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 50);

    fn();
    fn.cancel();

    await delay(80);
    assert.strictEqual(callCount, 0);
  });

  it('should flush pending invocation immediately', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; return 42; }, 50);

    fn();
    assert.strictEqual(callCount, 0);

    const result = fn.flush();
    assert.strictEqual(callCount, 1);
    assert.strictEqual(result, 42);
  });

  it('should report pending state', async () => {
    const fn = debounce(() => {}, 50);

    assert.strictEqual(fn.pending, false);

    fn();
    assert.strictEqual(fn.pending, true);

    await delay(80);
    assert.strictEqual(fn.pending, false);
  });

  it('should respect maxWait', async () => {
    let callCount = 0;
    const fn = debounce(() => { callCount++; }, 50, { maxWait: 100 });

    const start = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - start < 200) {
        fn();
      }
    }, 10);

    await delay(150);
    clearInterval(interval);

    assert.ok(callCount >= 1, `Expected at least 1 call, got ${callCount}`);
  });

  it('should cancel on AbortSignal', async () => {
    let callCount = 0;
    const controller = new AbortController();
    const fn = debounce(() => { callCount++; }, 50, { signal: controller.signal });

    fn();
    controller.abort();

    await delay(80);
    assert.strictEqual(callCount, 0);
    assert.strictEqual(fn.pending, false);
  });

  it('should pass arguments to the underlying function', async () => {
    let received: unknown[] = [];
    const fn = debounce((...args: unknown[]) => { received = args; }, 50);

    fn('a', 'b', 'c');
    await delay(80);
    assert.deepStrictEqual(received, ['a', 'b', 'c']);
  });

  it('should use the last call arguments', async () => {
    let received: string | undefined;
    const fn = debounce((val: string) => { received = val; }, 50);

    fn('first');
    fn('second');
    fn('third');

    await delay(80);
    assert.strictEqual(received, 'third');
  });
});

describe('throttle', () => {
  it('should invoke immediately on first call', () => {
    let callCount = 0;
    const fn = throttle(() => { callCount++; }, 50);

    fn();
    assert.strictEqual(callCount, 1);
  });

  it('should rate-limit subsequent calls', async () => {
    let callCount = 0;
    const fn = throttle(() => { callCount++; }, 50);

    fn();
    fn();
    fn();

    assert.strictEqual(callCount, 1);

    await delay(80);
    assert.strictEqual(callCount, 2);
  });

  it('should support cancel', async () => {
    let callCount = 0;
    const fn = throttle(() => { callCount++; }, 50);

    fn();
    assert.strictEqual(callCount, 1);

    fn();
    fn.cancel();

    await delay(80);
    assert.strictEqual(callCount, 1);
  });
});

describe('debounceAsync', () => {
  it('should return a shared promise for skipped callers', async () => {
    let callCount = 0;
    const fn = debounceAsync(async (val: string) => {
      callCount++;
      return `result-${val}`;
    }, 50);

    const p1 = fn('a');
    const p2 = fn('b');
    const p3 = fn('c');

    assert.strictEqual(p1, p2);
    assert.strictEqual(p2, p3);

    const result = await p3;
    assert.strictEqual(result, 'result-c');
    assert.strictEqual(callCount, 1);
  });

  it('should report pending state', async () => {
    const fn = debounceAsync(async () => 'ok', 50);

    assert.strictEqual(fn.pending, false);
    const p = fn();
    assert.strictEqual(fn.pending, true);

    await p;
    assert.strictEqual(fn.pending, false);
  });

  it('should reject with AbortError on cancel', async () => {
    const fn = debounceAsync(async () => 'ok', 50);

    const p = fn();
    fn.cancel();

    await assert.rejects(p, (err: Error) => {
      assert.strictEqual(err.name, 'AbortError');
      return true;
    });
  });

  it('should propagate errors from the async function', async () => {
    const fn = debounceAsync(async () => {
      throw new Error('boom');
    }, 50);

    const p = fn();
    await assert.rejects(p, (err: Error) => {
      assert.strictEqual(err.message, 'boom');
      return true;
    });
  });

  it('should cancel on AbortSignal', async () => {
    const controller = new AbortController();
    const fn = debounceAsync(async () => 'ok', 50, { signal: controller.signal });

    const p = fn();
    controller.abort();

    await assert.rejects(p, (err: Error) => {
      assert.strictEqual(err.name, 'AbortError');
      return true;
    });
  });
});
