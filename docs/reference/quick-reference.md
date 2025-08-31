# Locus Quick Reference (Phase 1)

Core Blocks:
- `database { entity Name { field: String? other: list of Integer } }`
- `workflow Name { trigger { on: create(Entity) } steps { run { action: doThing } } }`
- `design_system { colors { primary: #3366ff } }`

Field Types:
- Primitives: `String`, `Text`, `Integer`, `Decimal`, `Boolean`, `DateTime`, `Json`
- Lists: `list of <Primitive>` (no optional marker on list)
- Optional: append `?` to primitive (e.g. `String?`)

Relations:
- `has_many`, `belongs_to`, `has_one`

Workflow Steps:
- `run { action: myAction }`
- `delay { seconds: 5 }`
- `for_each item in items { run { action: process } }`
- `branch { steps { ... } else { steps { ... } } }`

Reserved Keywords:
`else`, `elseif`, `guard`, `in`

Naming Guidelines (warnings only):
- Use PascalCase for entities, components, pages, workflows.

This cheat sheet will expand in later phases.
