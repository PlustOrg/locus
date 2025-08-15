# Data Modeling: The `database` Block

The `database` block is the cornerstone of a Locus application's data layer. It's used inside any `.locus` file to define your application's data structure, including models, fields, and relationships.

The Locus compiler will discover all `.locus` files in your project, parse every `database` block, and merge their contents into a single, unified schema. This allows you to co-locate entity definitions with the features that use them or group them all in a central `database.locus` file.

This unified schema is then used to generate:
1.  **Database Schemas and Migrations:** Automatically creating and updating your database structure.
2.  **A Type-Safe Data API:** Providing a set of functions for creating, reading, updating, and deleting data with full type safety.
3.  **Entity Definitions for the Frontend:** Making your data models available throughout your application logic.

## Defining Entities

An `entity` is a blueprint for a data model, which translates directly to a database table. It's a collection of fields, each with a specific type and optional attributes.

**Example:**

```locus
// file: database.locus

database {
  entity Customer {
    name: String
    email: String (unique)
    subscribedAt: DateTime (default: now())
    isActive: Boolean (default: true)
  }
}

// You could define another entity in a separate file,
// and Locus will understand it's part of the same database.

// file: products.locus
database {
  entity Product {
    sku: String (unique)
    description: Text
    price: Decimal
    stock: Integer
    imageUrl: String? // The '?' denotes an optional field
  }
}
```

### Developer Q&A

> **Q: How does the merging work if I define the same entity in two different files?**
> **A:** Defining the same entity twice will result in a compiler error. However, you can define relationships for an entity in a different file. For example, `users.locus` can define the `User` entity, and `blog.locus` can define a `Post` entity and add the `posts: has_many Post` relationship to the `User` entity. The compiler will intelligently merge these definitions.

## Field Types

Locus provides a core set of intuitive data types that map to appropriate types in both the generated database and the TypeScript code.


| Type      | Description                                                  | SQL (PostgreSQL) Equivalent | TypeScript Equivalent |
| :-------- | :----------------------------------------------------------- | :-------------------------- | :-------------------- |
| `String`  | For short text, like names, titles, or emails.               | `VARCHAR(255)`              | `string`              |
| `Text`    | For long-form text, like blog posts or descriptions.         | `TEXT`                      | `string`              |
| `Integer` | For whole numbers.                                           | `INTEGER`                   | `number`              |
| `Decimal` | For numbers with decimal points, ideal for currency.         | `DECIMAL(10, 2)`            | `number`              |
| `Boolean` | For true/false values.                                       | `BOOLEAN`                   | `boolean`             |
| `DateTime`| For storing specific dates and times.                        | `TIMESTAMP WITH TIME ZONE`  | `Date`                |
| `Json`    | For storing arbitrary JSON data.                             | `JSONB`                     | `any`                 |

## Field Attributes

Attributes are modifiers placed after a field type that provide constraints and special properties.

*   **`?` (Optional Marker)**
    *   Placing a `?` after a type name (e.g., `String?`) marks the field as optional.
    *   In the database, this translates to a `NULLABLE` column.
    *   In TypeScript, the type will be `string | null`.

*   **`(unique)`**
    *   Ensures that every value in this column is unique across all records.
    *   The compiler will generate a unique index on this database column.
    *   Example: `email: String (unique)`

*   **`(default: ...)`**
    *   Provides a default value if one is not specified during record creation.
    *   **Common Defaults:**
        *   `DateTime`: `(default: now())` - Sets the current timestamp.
        *   `Boolean`: `(default: true)` or `(default: false)`
        *   `String`: `(default: "initial value")`
        *   `Integer`: `(default: 0)`

*   **`(map: "db_column_name")`**
    *   An escape hatch that allows you to specify a different underlying column name in the database. This is useful for integrating with legacy databases that have different naming conventions.
    *   Example: `isActive: Boolean (map: "is_active_user")`

## Relationships

Defining how entities relate to each other is a core strength of Locus. The syntax is designed to be readable and expressive, using plain English keywords. The compiler handles the complexity of foreign keys and join tables automatically.

### One-to-Many (`has_many` / `belongs_to`)

This is the most common relationship type.

```locus
database {
  entity Customer {
    // ... fields
    orders: has_many Order // A customer can have many orders
  }

  entity Order {
    // ... fields
    customer: belongs_to Customer // An order belongs to one customer
  }
}
```

**How it Works:**
*   Locus will automatically add a `customerId` foreign key column to the `Order` table.
*   In the generated API, you'll be able to access `customer.orders` and `order.customer`.

### Many-to-Many (`has_many` on both sides)

A many-to-many relationship is declared by placing a `has_many` on both sides of the relationship.

```locus
database {
  entity Product {
    // ... fields
    categories: has_many Category
  }

  entity Category {
    name: String
    products: has_many Product
  }
}
```

**How it Works:**
*   The Locus compiler will automatically generate the required join table (e.g., `_CategoryToProduct`) in the background. You never have to think about it.
*   This allows you to associate a product with multiple categories and a category with multiple products.

### One-to-One

A one-to-one relationship is defined by adding the `(unique)` attribute to a `belongs_to` field.

```locus
database {
  entity User {
    // ... fields
    profile: has_one UserProfile
  }

  entity UserProfile {
    bio: Text
    user: belongs_to User (unique) // This ensures a user can only have one profile
  }
}
```

### Self-Referential Relationships

Entities can even relate to themselves, which is useful for modeling hierarchical data like comments with replies.

```locus
database {
  entity Comment {
    text: String
    parent: belongs_to Comment? // A comment can belong to another comment
    replies: has_many Comment
  }
}
```
