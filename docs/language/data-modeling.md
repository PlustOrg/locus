# Data Modeling Reference

In Locus, you define your application's data structure inside `database` blocks. You can have `database` blocks in any `.locus` file; the compiler will intelligently merge them into a single, unified schema for your entire project.

This document serves as a complete reference for all data modeling features.

## `entity`
An `entity` is the core of your data model. It represents a table in your database and is defined by a collection of fields and relationships.

```locus
database {
  entity Product {
    // fields and relationships go here
  }
}
```

## Fields
Fields represent the scalar data in your entity (the columns in your database table).

```locus
entity Product {
  name: String
  stockCount: Integer @default(0)
  description: Text?
  tags: list of String
}
```

### Scalar Types
Locus provides a set of built-in primitive types.

| Type       | Description                                                              |
| :--------- | :----------------------------------------------------------------------- |
| `String`   | For short text, like names, titles, or emails. Maps to `String`.          |
| `Text`     | For long-form text. Maps to `String` with a `@db.Text` attribute.        |
| `Integer`  | For whole numbers. Maps to `Int`.                                        |
| `Decimal`  | For numbers with decimal points. Maps to `Decimal`.                      |
| `Boolean`  | For `true` or `false` values. Maps to `Boolean`.                         |
| `DateTime` | For storing specific dates and times. Maps to `DateTime`.                |
| `Json`     | For storing arbitrary JSON data. Maps to `Json`.                         |
| `BigInt`   | For very large integers. Maps to `BigInt`.                               |
| `Float`    | For floating-point numbers. Maps to `Float`.                             |
| `UUID`     | For UUID values. Maps to `String` with UUID validation.                  |
| `Email`    | For email addresses. Maps to `String` with email validation.             |
| `URL`      | For URLs. Maps to `String` with URL validation.                          |

### List Types
You can also define a field as a list of a primitive type. This is useful for things like tags, roles, or simple arrays of strings or numbers.

```locus
entity Article {
  tags: list of String
  visitorScores: list of Integer
}
```
**Important Rules for List Types:**
- List fields **cannot** be marked as optional with `?`.
- List fields **cannot** have a `@default(...)` attribute.

### Field Attributes & Modifiers
You can modify field behavior with annotations (prefixed by `@`) or suffix markers.

#### Optional vs Nullable
Optional and nullable are distinct concepts:

| Form | Meaning | May be omitted in create/update input? | Can store NULL in DB? |
|------|---------|----------------------------------------|-----------------------|
| `description: Text?` | Optional (NOT nullable) | Yes | No (future: absence means not written) |
| `middleName: String | Null` | Nullable (required presence) | No (must appear; value may be null) | Yes |
| `comment: Text? | Null` | Optional + Nullable | Yes | Yes |

To allow actual NULL storage, include `| Null` (or forthcoming `nullable` keyword form). For deeper discussion see [Nullable vs Optional](../guides/nullable-vs-optional.md) and [Syntax Conventions](../reference/conventions.md).

#### `?` (Optional Marker)
Applies only to *non‑list* scalar or relation foreign key fields. Do **not** use on list types (`Tags: String[]?` invalid).

#### `@unique`
Ensures every record has a unique value for this field.
```locus
email: String @unique
```

#### `@default(...)`
Provides a default value when a record is created.
```locus
// Static values
isActive: Boolean @default(true)
role: String @default("user")
stock: Integer @default(0)

// Dynamic values (function calls)
createdAt: DateTime @default(now())
```
> **Integer Range:** Numeric defaults for `Integer` must be within 32‑bit signed range (−2,147,483,648 .. 2,147,483,647).

##### Allowed Default Functions
Only the following function-style defaults are currently supported:

| Function | Description |
|----------|-------------|
| `now()` | Current timestamp |
| `uuid()` | Random UUID v4 |
| `cuid()` | Collision-resistant id |
| `autoincrement()` | Auto-incrementing integer |

If you use a non-whitelisted function (e.g. `random()`), validation fails with an error: `Unsupported default function 'random' ...`.

#### `@map("...")`
Overrides the underlying column name (helpful for legacy schemas or different naming conventions).
```locus
// Named 'emailAddress' in code, stored as 'user_email'
emailAddress: String @map("user_email")
```

#### Validation Attributes
Locus supports several validation attributes for enhanced data integrity:

##### `@min(n)` / `@max(n)`
Sets minimum and maximum values for numeric fields:
```locus
age: Integer @min(0) @max(120)
price: Decimal @min(0.01)
```

##### `@length(min: n, max: n)`
Sets length constraints for string fields:
```locus
username: String @length(min: 3, max: 20)
```

##### `@pattern("regex")`
Validates string fields against a regular expression:
```locus
phoneNumber: String @pattern("^\\+?[1-9]\\d{1,14}$")
```

##### `@email`
Validates that a string is a valid email address:
```locus
email: String @email
```

##### `@enum([values])`
Constrains a field to specific allowed values:
```locus
status: String @enum(["draft", "published", "archived"])
```

##### `@policy("rule")`
Applies a security policy to the field:
```locus
sensitiveData: String @policy("admin_only")
```

### Canonical Attribute Ordering
When multiple annotations are present they are normalized to this order for deterministic generation:
1. `@id`
2. `@unique`
3. `@default(...)`
4. `@map(...)`
5. `@policy(...)`
6. Plugin / custom (alphabetical)

> Applying this ordering avoids needless diff churn in generated artifacts & snapshots.

### List & Default Rules (Callout)
> **Warning:**
> - List fields cannot be marked optional with `?`; represent absence as an empty list.
> - List fields cannot have `@default(...)` (future enhancement may allow `@default([])`).
> - A default of `null` on an optional‑only (non‑nullable) field is invalid; either remove the default or mark the field nullable (`| Null`).

## Relationships
You define relationships between entities using special keywords.

### One-to-Many
This is the most common relationship. Use `has_many` on one side and `belongs_to` on the other.

**Key Rule:** A `belongs_to` relationship requires you to **explicitly define the foreign key field**. The foreign key field must be named `relationNameId`.

```locus
database {
  entity Author {
    // An author can have many posts
    posts: has_many Post
  }

  entity Post {
    // A post belongs to one author
    author: belongs_to Author

    // You MUST define the foreign key field for 'author'
    authorId: Integer
  }
}
```
In this example, the `author` relation on `Post` is linked to the `authorId` field.

### One-to-One
A one-to-one relationship is created by making a `belongs_to` field unique.

```locus
database {
  entity User {
    // A user has one profile
    profile: has_one Profile
  }

  entity Profile {
    // A profile belongs to one user, and this link must be unique
    user: belongs_to User @unique

    // You still need the foreign key field
    userId: Integer
  }
}
```
Here, `has_one` is used for clarity, but the uniqueness is enforced by the `@unique` annotation on the `belongs_to` side.

#### Cascade Deletion
You can specify what happens when the referenced entity is deleted:

```locus
entity Post {
  author: belongs_to User (onDelete: cascade)
  authorId: Integer
}
```

Supported cascade options:
- `cascade`: Delete this record when the referenced record is deleted
- `restrict`: Prevent deletion of the referenced record if this record exists
- `set_null`: Set the foreign key to null when the referenced record is deleted

### Many-to-Many
To create a many-to-many relationship, use `has_many` on both sides of the relationship. Locus will automatically create and manage the hidden join table for you.

```locus
database {
  entity Article {
    title: String
    // An article can have many categories
    categories: has_many Category
  }

  entity Category {
    name: String
    // A category can have many articles
    articles: has_many Article
  }
}
```

## Nullable vs Optional Migration

The compiler now distinguishes between optional presence (`?`) and nullable value (`| Null`). Use this guide when updating legacy schemas:

1. If a field previously used `?` to mean it can store nulls, migrate to `Type | Null`.
2. Reserve `?` for cases where the field may be omitted entirely from inputs.
3. Do not combine `?` and `| Null` unless both semantics are desired; the validator will warn on conflicting patterns in future releases.
4. Generators map optional fields to nullable database columns only when explicitly unioned with `Null`.

Example:
```locus
// Legacy (still supported)
entity User { middleName: String? }

// Nullable but required
entity User { middleName: String | Null }

// Optional (absent vs present) - note: suffix form
entity User { middleName: String? }
```

This section is a living migration aid; expect future enhancements with automated quick‑fixes.
