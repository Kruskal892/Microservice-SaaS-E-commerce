# Database Design (ERD)

[Documentation index](../README.md)

**Priority:** Critical. **Status:** Initial Prisma/MongoDB schema configured;
commerce ERD remains proposed. Database synchronization and runtime persistence
are unverified. **Updated:** 2026-10-15.

## Current Prisma schema

Source: [schema.prisma](../../prisma/schema.prisma) and
[Prisma CLI configuration](../../prisma.config.ts). The generator is `prisma-client`
with output `generated/prisma`. No service imports or instantiates the client.

| Model | Declared fields and constraints |
| ----- | ------------------------------- |
| `users` | ObjectId `id` mapped to `_id`, required `name`, unique `email`, optional `password`, optional `avatar`, string-array `following`, `createdAt` defaulting to now, auto-updated `updatedAt`, required ObjectId `imagesId` |
| `images` | ObjectId `id` mapped to `_id`, required `file_id` and `url`, optional unique ObjectId `userId`, optional `users` relation |

The avatar relation is owned by `images.userId` and references `users.id`, allowing
at most one linked image per user through the declared unique field. `users.imagesId`
is a separate required scalar, not the relation field; clarify or remove it before
writing users. `following` contains strings without a declared user relation.
The schema does not implement email normalization, password hashing, input
validation, upload handling, or user authorization. `password` must not be treated
as evidence of safe credential storage.

Unique email/user-image constraints are schema declarations, not proof that indexes
were applied. The reported Atlas `db push` attempt failed authentication. No migration
or seed files are present. See [setup](../development/getting-started.md#prisma-and-mongodb).

The following commerce model is a proposal, distinct from the current schema.

## 1. Ownership and modeling

Auth owns identity. Commerce ownership and physical database separation are
undecided. References across boundaries are not enforced foreign keys or permission
to access another service's database. This draft assumes one storefront; tenancy
would require reviewing every key, index, and ownership check.

MongoDB collections replace relational tables here. Cart/order lines are embedded;
users and products are independently addressable. This is a logical ERD, not SQL.

## 2. Proposed ERD

```mermaid
erDiagram
    USER ||--o| CART : owns
    USER ||--o{ ORDER : places
    CART ||--o{ CART_ITEM : embeds
    ORDER ||--|{ ORDER_ITEM : embeds
    PRODUCT ||--o{ CART_ITEM : referenced_by
    PRODUCT ||--o{ ORDER_ITEM : historical_reference
    USER {
        ObjectId id PK
        string email UK
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }
    PRODUCT {
        ObjectId id PK
        string name
        string description
        int priceMinor
        string currency
        int stockQuantity
        boolean active
        datetime createdAt
        datetime updatedAt
    }
    CART {
        ObjectId id PK
        ObjectId userId UK
        int version
        datetime updatedAt
    }
    CART_ITEM {
        ObjectId productId
        int quantity
    }
    ORDER {
        ObjectId id PK
        ObjectId userId
        string idempotencyKey
        string requestFingerprint
        string status
        string currency
        int totalMinor
        datetime createdAt
    }
    ORDER_ITEM {
        ObjectId productId
        string productName
        int unitPriceMinor
        int quantity
    }
```

PK/UK denote intended identifiers/unique indexes. User/product references are
logical; order snapshots survive later product changes or removal.

## 3. Collections, constraints, and indexes

| Collection | Proposed constraints                                                                         | Proposed indexes / use                                                    |
| ---------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `users`    | Normalized unique email; never expose passwordHash                                           | Unique email; default `_id`                                               |
| `products` | Nonempty name; nonnegative integer price/stock; currency                                     | `(active, createdAt, _id)` for stable catalog pagination                  |
| `carts`    | One per customer; unique product lines; positive integer quantities; versioned updates       | Unique `userId`                                                           |
| `orders`   | Nonempty items; immutable snapshots; consistent currency; server total; matching key/request | Unique `(userId, idempotencyKey)`; `(userId, createdAt, _id)` for history |

Validate in the owning service and apply database constraints where supported.
Embedded-array indexes do not by themselves enforce unique products inside one
cart; validate or update atomically. Decide string/item/quantity limits, currency
precision, and overflow bounds before implementation.

## 4. Consistency and deletion

Cart edits use an expected version to avoid lost updates. Order creation needs
idempotency, price snapshots, stock checks, and durable writes without negative
inventory or lost carts. Decide a transaction/reservation strategy and verify its
database topology before checkout. Cross-service transactions are not assumed.

Archive products without rewriting historical lines. Account anonymization,
order retention, session cleanup, backups, and deletion obligations are undecided.
Add payment/fulfillment models only after their lifecycle is specified. Session
storage is deliberately absent until the identity strategy is chosen.

## 5. Delivery and checks

Build on the initial users/images schema with service integration, reviewed index
creation, repeatable seed data, and verified environment setup. Establish a connector-appropriate schema
deployment process; SQL migration behavior is not implied. Verify concurrent
uniqueness, cart conflicts, order retries, stock consistency, and backup restore.
See [TDD](technical-design.md) and [plan](../delivery/implementation-plan.md).
