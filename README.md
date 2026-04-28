# @philiprehberger/debounce-ts

[![CI](https://github.com/philiprehberger/ts-debounce/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-debounce/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/debounce-ts.svg)](https://www.npmjs.com/package/@philiprehberger/debounce-ts)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-debounce)](https://github.com/philiprehberger/ts-debounce/commits/main)

Typed debounce and throttle with cancel, flush, and pending state

## Installation

```bash
npm install @philiprehberger/debounce-ts
```

## Usage

```ts
import { debounce } from '@philiprehberger/debounce-ts';

const handleResize = debounce(() => {
  console.log('Window resized');
}, 300);

window.addEventListener('resize', handleResize);

// Cancel any pending call
handleResize.cancel();

// Invoke immediately if pending
handleResize.flush();

// Check if a call is pending
console.log(handleResize.pending); // true or false
```

### Debounce with options

```ts
import { debounce } from '@philiprehberger/debounce-ts';

const search = debounce(
  (query: string) => fetchResults(query),
  250,
  {
    leading: true,    // invoke on the leading edge
    trailing: true,   // invoke on the trailing edge (default)
    maxWait: 1000,    // maximum time fn can be delayed
  }
);

search('hello');
```

### Throttle

```ts
import { throttle } from '@philiprehberger/debounce-ts';

const handleScroll = throttle(() => {
  console.log('Scroll event');
}, 200);

window.addEventListener('scroll', handleScroll);
```

### Async debounce

```ts
import { debounceAsync } from '@philiprehberger/debounce-ts';

const fetchSuggestions = debounceAsync(async (query: string) => {
  const res = await fetch(`/api/suggest?q=${query}`);
  return res.json();
}, 300);

// All callers during the wait period share the same promise
const results = await fetchSuggestions('hello');
```

### Async debounce with safety timeout

```ts
import { debounceAsync, DebounceTimeoutError } from '@philiprehberger/debounce-ts';

// Auto-cancel a pending invocation after 2s if calls keep arriving
const search = debounceAsync(
  async (q: string) => fetch(`/api/search?q=${q}`).then((r) => r.json()),
  300,
  { safetyTimeout: 2000 }
);

try {
  const result = await search('hel');
} catch (err) {
  if (err instanceof DebounceTimeoutError) {
    console.warn(`Search timed out after ${err.timeout}ms`);
  }
}
```

### AbortSignal support

```ts
import { debounce } from '@philiprehberger/debounce-ts';

const controller = new AbortController();

const fn = debounce(() => console.log('called'), 300, {
  signal: controller.signal,
});

fn();
controller.abort(); // cancels the pending call
```

## API

| Function | Description |
|---|---|
| `debounce(fn, wait, options?)` | Returns a debounced function with `cancel()`, `flush()`, and `pending` |
| `throttle(fn, wait, options?)` | Returns a throttled function (debounce with `maxWait = wait`, leading + trailing) |
| `debounceAsync(fn, wait, options?)` | Returns a debounced async function with shared promise and `cancel()` |
| `DebounceTimeoutError` | Error thrown by `debounceAsync` when a pending call exceeds `safetyTimeout` |

### DebounceOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `leading` | `boolean` | `false` | Invoke on the leading edge of the wait |
| `trailing` | `boolean` | `true` | Invoke on the trailing edge of the wait |
| `maxWait` | `number` | - | Maximum time `fn` can be delayed before forced invocation |
| `signal` | `AbortSignal` | - | Abort signal to cancel pending invocation |

### DebounceAsyncOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `signal` | `AbortSignal` | - | Abort signal to cancel pending invocation |
| `safetyTimeout` | `number` | - | Auto-cancel a pending call after this many ms, rejecting with `DebounceTimeoutError` |

## Development

```bash
npm install
npm run build
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-debounce)

🐛 [Report issues](https://github.com/philiprehberger/ts-debounce/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-debounce/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
