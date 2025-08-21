# Common Errors & Fixes

This guide shows frequent errors you might encounter in `.locus` files and how to resolve them. Locus focuses on clear messages, exact locations, and helpful tips.

## Missing colon between field name and type

Example:

```
entity User {
  name String
}
```

Error:
- Message: "Expected ':' but found 'String'"
- Fix: Add a colon between the field name and type.

Correct:

```
entity User {
  name: String
}
```

## Invalid design_system token names

Token keys must be lower_snake_case starting with a letter.

Example:

```
design_system {
  typography { weights { BadKey: 700 } }
}
```

Error:
- Message: "Invalid design_system token name 'BadKey'. Use lower_snake_case starting with a letter."
- Fix: Rename to `bad_key` or similar.

## Duplicate entity or field names

Example:

```
database {
  entity User { id: Integer id: Integer }
  entity User { }
}
```

Error:
- Duplicate field name in entity `User`.
- Duplicate entity `User` defined multiple times.

Fix:
- Use unique field names within an entity.
- Rename or merge duplicate entity definitions.

## Unexpected '}' or block start

Example:

```
database { entity User } }
```

Error:
- Parser error pointing at the stray '}'.

Fix:
- Ensure braces are balanced and blocks have the right structure.

## Structured JSON errors

Use `--errors json` with `locus build` or `locus dev` to integrate with editors and tools.
See CLI reference for the JSON schema.
