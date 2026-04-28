# Changelog

## 0.2.0 (2026-04-27)

- Add `safetyTimeout` option to `debounceAsync` that auto-cancels a pending invocation after the configured ms, rejecting the shared promise with a new exported `DebounceTimeoutError`
- Export `DebounceAsyncOptions` and `DebounceTimeoutError` from the package entry
- Compliance: README structure aligned with template

## 0.1.2

- Standardize README to 3-badge format with emoji Support section
- Update CI actions to v5 for Node.js 24 compatibility
- Add GitHub issue templates, dependabot config, and PR template

## 0.1.1

- Standardize README structure and badges

## 0.1.0

- Initial release
- `debounce()` with leading/trailing/maxWait options, cancel, flush, pending
- `throttle()` as preconfigured debounce
- `debounceAsync()` with shared promise for skipped callers
- AbortSignal support for cleanup
