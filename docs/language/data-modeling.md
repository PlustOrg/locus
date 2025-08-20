# Data Modeling in Locus

Locus provides a powerful, declarative syntax for modeling your application's data. All data models are defined in `database` blocks within `.locus` files. The compiler merges these blocks into a unified schema, generating type-safe APIs and database migrations.

## Defining Entities

Entities are the core building blocks of your data model. Each entity maps to a database table and is defined with fields and relationships.

```locus
database {
  entity Customer {
    name: String
    email: String (unique)
    subscribedAt: DateTime (default: now())
    isActive: Boolean (default: true)
  }
}
```

## Field Types and Attributes

| Type      | Description                                     |
| :-------- | :---------------------------------------------- |
| `String`  | For short text, like names, titles, or emails.  |
| `Text`    | For long-form text.                             |
| `Integer` | For whole numbers.                              |
| `Decimal` | For numbers with decimal points.                |
| `Boolean` | For true/false values.                          |
| `DateTime`| For storing specific dates and times.           |
| `Json`    | For storing arbitrary JSON data.                |

**Attributes:**
- `?` (Optional): Makes a field nullable.
- `(unique)`: Ensures uniqueness.
- `(default: ...)`: Sets a default value.
- `(map: "db_column_name")`: Maps to a custom DB column name.

## Relationships

Locus supports one-to-many, many-to-many, one-to-one, and self-referential relationships with simple syntax:

```locus
database {
  entity Customer {
    orders: has_many Order
  }
  entity Order {
    customer: belongs_to Customer
  }
}
```

- **One-to-Many:** `has_many` and `belongs_to`.
- **Many-to-Many:** `has_many` on both sides.
- **One-to-One:** `has_one` and `belongs_to (unique)`.
- **Self-Referential:** Entities can relate to themselves.

## Merging and Validation

The compiler merges all `database` blocks, validates for duplicate entities, and generates:
- Prisma schema for migrations
- Type-safe backend API
- Frontend entity types

See [Data Relationships](../guides/data-relationships.md) for advanced patterns.
