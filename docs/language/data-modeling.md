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
  stockCount: Integer (default: 0)
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
- List fields **cannot** have a `(default: ...)` attribute.

### Field Attributes
You can modify field behavior with attributes placed after the type.

- **`?` (Optional Marker)**
  Marks a field as optional (nullable in the database). If omitted, the field is required.
  ```locus
  description: Text? // This field can be empty
  ```

- **`(unique)`**
  Ensures that every record in the table has a unique value for this field.
  ```locus
  email: String (unique)
  ```

- **`(default: ...)`**
  Provides a default value for a field when a new record is created.
  ```locus
  // Static values
  isActive: Boolean (default: true)
  role: String (default: "user")
  stock: Integer (default: 0)

  // Dynamic values (function calls)
  createdAt: DateTime (default: now())
  ```
  > **Note:** Default values for `Integer` fields must be within the 32-bit signed integer range (-2,147,483,648 to 2,147,483,647).

- **`(map: "...")`**
  Specifies a different, underlying column name in the database. This is useful for mapping to legacy databases or for using a different naming convention.
  ```locus
  // This field is named 'emailAddress' in Locus code,
  // but maps to the 'user_email' column in the database.
  emailAddress: String (map: "user_email")
  ```

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
    user: belongs_to User (unique)

    // You still need the foreign key field
    userId: Integer
  }
}
```
Here, `has_one` is used for clarity, but the uniqueness is enforced by the `(unique)` attribute on the `belongs_to` side.

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
