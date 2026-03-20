# @philiprehberger/debounce-ts

[![CI](https://github.com/philiprehberger/ts-debounce/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-debounce/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/debounce-ts)](https://www.npmjs.com/package/@philiprehberger/debounce-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Typed debounce and throttle with cancel, flush, and pending state.

## Requirements

- Node.js >= 18

## Installation

```bash
npm install @philiprehberger/debounce-ts
```

## Usage

### Debounce

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

### DebounceOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `leading` | `boolean` | `false` | Invoke on the leading edge of the wait |
| `trailing` | `boolean` | `true` | Invoke on the trailing edge of the wait |
| `maxWait` | `number` | - | Maximum time `fn` can be delayed before forced invocation |
| `signal` | `AbortSignal` | - | Abort signal to cancel pending invocation |

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
