# Parser Performance

This document tracks basic parser performance measurements to characterize cost and detect regressions.

## Quick benchmark

- Tokenize + parse a medium file (5 entities, 3 pages, 3 components) 100x
- Report total ms and tokens/sec

Run: npm run bench:parser

## Regression guard

- Run: npm run bench:assert
- Baseline config: planning/perf-baseline.json
- If tokensPerSec falls below tokensPerSecMin, the script exits non-zero.
- Update the baseline when making intended performance changes.
