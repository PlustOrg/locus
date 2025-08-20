# Modeling Data Relationships

A key strength of Locus is its simple yet powerful syntax for defining relationships between your data models. The compiler takes these high-level, readable declarations and automatically generates the correct database schema, including foreign keys and join tables, so you can focus on your application's logic instead of database internals.

All relationships are defined within the `database` block, alongside your entity's fields.

## One-to-Many Relationships

This is the most common type of relationship, where one record can be associated with many other records. For example, a `Customer` can have many `Order`s, but each `Order` belongs to only one `Customer`.

This is defined using a `has_many` / `belongs_to` pair.

```locus
database {
  entity Customer {
    name: String
    
    // The `has_many` side of the relationship.
    // This creates a virtual 'orders' field on the Customer model.
    orders: has_many Order
  }

  entity Order {
    amount: Decimal
    orderDate: DateTime
    
    // The `belongs_to` side of the relationship.
    // This tells Locus that an Order is owned by a Customer.
    customer: belongs_to Customer
  }
}
```

### How It Works Under the Hood

1.  **Foreign Key Generation:** The Locus compiler sees the `belongs_to Customer` declaration and automatically adds a `customerId` integer column to the `Order` table in the database. This column is the foreign key that links an order back to its customer.
2.  **Type-Safe API:** The generated data access API will be fully aware of this relationship. You'll be able to write code like:
    *   `const ordersForCustomer = customer.orders`
    *   `const customerOfOrder = order.customer`
    *   `create(Order, { amount: 99.99, customer: { connect: { id: customerId } } })`

## Many-to-Many Relationships

A many-to-many relationship is used when records on both sides can be associated with multiple records on the other side. For example, a `Product` can be in many `Category`s, and a `Category` can contain many `Product`s.

This is defined by simply putting `has_many` on both sides of the relationship.

```locus
database {
  entity Product {
    name: String
    
    // A product can have many categories.
    categories: has_many Category
  }

  entity Category {
    name: String
    
    // A category can have many products.
    products: has_many Product
  }
}
```

### How It Works Under the Hood

*   **Automatic Join Table:** You don't have to think about it, but the compiler will generate a hidden "join table" (e.g., `_CategoryToProduct`) in the database. This table has two columns, `categoryId` and `productId`, and each row represents an association between a product and a category.
*   **Seamless API:** The generated API hides this complexity. You can simply work with the `categories` and `products` fields as if they were regular lists:
    *   `product.categories.add(someCategory)`
    *   `const productsInCategory = category.products`

## One-to-One Relationships

A one-to-one relationship is used when a record in one table is linked to at most one record in another table. For example, a `User` has exactly one `Profile`.

This is defined by adding the `(unique)` attribute to a `belongs_to` field.

```locus
database {
  entity User {
    email: String
    
    // The `has_one` declaration is optional but improves clarity.
    profile: has_one UserProfile
  }

  entity UserProfile {
    bio: Text
    website: String?
    
    // This combination creates the one-to-one link.
    // `belongs_to` sets up the foreign key.
    // `(unique)` ensures that no two profiles can point to the same user.
    user: belongs_to User (unique)
  }
}
```

## Self-Referential Relationships

Entities can even relate to themselves. This is very useful for modeling hierarchical or recursive data structures, such as threaded comments, employee-manager relationships, or nested categories.

**Example: Threaded Comments**

```locus
database {
  entity Comment {
    text: String
    
    // A comment can optionally belong to a parent comment.
    // The '?' makes the relationship optional, allowing for top-level comments.
    parent: belongs_to Comment?
    
    // A comment can have many replies (which are also comments).
    replies: has_many Comment
  }
}
```

This simple definition allows you to build a tree of comments, where each comment can have a parent and a list of children.
