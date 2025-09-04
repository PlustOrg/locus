# Locus Quick Reference

Core Blocks:
- `database { entity Name { field: String? others: Integer[] } }`
- `workflow Name { trigger { on:create(Entity) } steps { run doThing(id) } }`
- `design_system { colors { "light" { primary: #3366ff } } }`

Field Types:
- Primitives: `String` `Text` `Integer` `Decimal` `Boolean` `DateTime` `Json`
- Lists: `Type[]` (legacy `list of Type` still parses). No `?` allowed on lists.
- Optional: append `?` to primitive (e.g. `String?`). Nullable: `Type | Null`.

Relations:
- `has_many`, `belongs_to`, `has_one`

Workflow Steps (MVP):
- `run action(args)`
- `delay { }` (placeholder)
- `branch { condition: expr steps { ... } else { ... } }`
- `forEach item in items { run act(item) }`
- `send_email { to: userEmail, subject: Welcome }`
- `http_request { }` (placeholder)
- `retry { max: 2, backoff: exponential, factor: 2 }` (root)
- `concurrency { group: name, limit: 5 }` (root)
- `on_error { action1 action2 }` / `on_failure { action }`

Workflow Step Kinds (One-liners):
| Kind | Purpose |
|------|---------|
| `run` | Invoke a named action handler. |
| `delay` | Placeholder timing step (future scheduling). |
| `branch` | Conditional execution with optional else. |
| `forEach` | Iterate collection binding current item. |
| `send_email` | Send email (to + subject/template). |
| `http_request` | Placeholder HTTP call (runtime pending). |
| `publish_event` | (Plugin example) emit app event. |

Reserved Keywords (partial): `else`, `elseif`, `guard`, `in`
Reserved Triggers: `on:webhook`, `on:create`, `on:update`, `on:delete`

Optional vs Nullable Quick Grid:
| Form | Optional? | Nullable? |
|------|-----------|-----------|
| `name: String?` | Yes | No |
| `name: String | Null` | No | Yes |
| `name: String? | Null` | Yes | Yes |

Example Error (Nullable vs Optional):
```
Error: Field 'nickname' default null but field is optional-only. Add '| Null' or remove default.
```

Annotations (canonical order): `@id` `@unique` `@default(...)` `@map(...)` `@policy(...)` `@custom...`

Naming Guidelines (warnings only): Use PascalCase for entities, components, pages, workflows.

Determinism: Generators sort lists & keys; keep examples ordered predictably.
