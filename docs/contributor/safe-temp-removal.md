# Safe Temporary Directory Removal

Transient EACCES/EBUSY/ENOTEMPTY errors on rapid test teardown (especially macOS) caused flakiness when cleaning temp output. The `safeRemove` helper mitigates this.

## Helper Location
`src/cli/utils.ts` exports `safeRemove(target, { retries=5, delayMs=30 })`.

## Strategy
- Retry a handful of times on transient filesystem errors.
- Uses a minimal blocking sleep (Atomics.wait) for tighter timing than setTimeout for small delays.
- Aborts early on non-transient errors.

## When to Use
- Test setup/teardown utilities removing generated directories.
- Cleanup of plugin sandbox temp dirs.

Avoid using it for user data paths to prevent accidental silent ignores.

## Example
```ts
import { safeRemove } from '../src/cli/utils';

beforeEach(()=> safeRemove(TMP_DIR));
```

## Future Improvements
- Convert to async variant with backoff jitter.
- Collect metrics on retry counts to refine defaults.

---
_Last updated: 2025-09-04_
