import { describe, it } from 'node:test';
import assert from 'node:assert';
import { debounceAsync, DebounceTimeoutError } from '../../dist/index.js';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('debounceAsync safetyTimeout', () => {
  it('rejects pending invocation with DebounceTimeoutError after safetyTimeout', async () => {
    const fn = debounceAsync(async () => 'ok', 50, { safetyTimeout: 100 });

    // Keep calling so the wait timer never fires; the safety timer should win.
    const p = fn();
    const interval = setInterval(() => {
      fn();
    }, 20);

    await assert.rejects(p, (err: Error) => {
      assert.ok(err instanceof DebounceTimeoutError, 'should be DebounceTimeoutError');
      assert.strictEqual(err.name, 'DebounceTimeoutError');
      return true;
    });

    clearInterval(interval);
    // Allow any in-flight reset to settle.
    await delay(30);
    assert.strictEqual(fn.pending, false);
  });

  it('exposes the configured timeout value on the error', async () => {
    const fn = debounceAsync(async () => 'ok', 50, { safetyTimeout: 80 });

    const p = fn();
    const interval = setInterval(() => fn(), 20);

    await assert.rejects(p, (err: unknown) => {
      assert.ok(err instanceof DebounceTimeoutError);
      assert.strictEqual((err as DebounceTimeoutError).timeout, 80);
      return true;
    });

    clearInterval(interval);
  });

  it('does not fire safetyTimeout when wait completes first', async () => {
    let callCount = 0;
    const fn = debounceAsync(async () => {
      callCount++;
      return 'ok';
    }, 30, { safetyTimeout: 500 });

    const result = await fn();
    assert.strictEqual(result, 'ok');
    assert.strictEqual(callCount, 1);

    // Wait past where the safety timer would have fired had it not been cancelled.
    await delay(550);
    assert.strictEqual(callCount, 1);
    assert.strictEqual(fn.pending, false);
  });

  it('does not start a safety timer when safetyTimeout is omitted', async () => {
    const fn = debounceAsync(async () => 'ok', 30);

    // Repeat calls past any reasonable safety window — should still resolve normally.
    const p = fn();
    for (let i = 0; i < 5; i++) {
      await delay(10);
      fn();
    }

    const result = await p;
    assert.strictEqual(result, 'ok');
  });

  it('resets safety state after the invocation runs', async () => {
    const fn = debounceAsync(async (v: number) => v * 2, 30, { safetyTimeout: 200 });

    const a = await fn(2);
    assert.strictEqual(a, 4);

    const b = await fn(5);
    assert.strictEqual(b, 10);
  });

  it('allows manual cancel to win over safetyTimeout', async () => {
    const fn = debounceAsync(async () => 'ok', 50, { safetyTimeout: 100 });

    const p = fn();
    fn.cancel();

    await assert.rejects(p, (err: Error) => {
      assert.strictEqual(err.name, 'AbortError');
      return true;
    });
  });
});

describe('DebounceTimeoutError', () => {
  it('has the correct name and is an Error subclass', () => {
    const err = new DebounceTimeoutError(150);
    assert.ok(err instanceof Error);
    assert.ok(err instanceof DebounceTimeoutError);
    assert.strictEqual(err.name, 'DebounceTimeoutError');
    assert.strictEqual(err.timeout, 150);
    assert.match(err.message, /150ms/);
  });

  it('accepts a custom message', () => {
    const err = new DebounceTimeoutError(200, 'custom message');
    assert.strictEqual(err.message, 'custom message');
    assert.strictEqual(err.timeout, 200);
  });
});
