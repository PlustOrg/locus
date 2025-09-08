---
title: API Validation Examples
description: Practical end-to-end examples using create, update, patch, relations, and hooks.
---

# API Validation Examples

## Create vs Patch
```ts
import { validateUserBody, validateUserPatch } from '../validation/User';

// Create
const createResult = validateUserBody({ email: 'a@b.com', age: 25 });

// Patch (only age)
const patchResult = validateUserPatch({ age: 26 });
```

## Relation Connect
```jsonc
{
  "total": 10,
  "user": { "connect": { "id": "user_1" } },
  "items": [ { "connect": { "id": 1 } } ]
}
```

## BigInt Normalization
```ts
const r = validateLedgerBody({ amount: 9007199254740993n });
// body.amount now a string "9007199254740993"
```

## Date Canonicalization
```ts
const r = validateEventBody({ ts: '2023-02-03T04:05:06Z' });
// event.ts stored as canonical ISO string
```

## Enabling JIT
```bash
export LOCUS_VALIDATION_JIT=1
```

## Capturing Feedback Snapshot
```ts
import { getValidationFeedback } from '../runtime/validationFeedback';
console.log(getValidationFeedback());
```
