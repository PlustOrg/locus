# Parser Performance

This document tracks basic parser performance measurements to characterize cost and detect regressions.

## Quick benchmark

- Tokenize + parse a medium file (5 entities, 3 pages, 3 components) 100x
- Report total ms and tokens/sec

Run: npm run bench:parser
