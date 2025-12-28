---
sidebar_position: 1
---

# Faker Annotations

Fakelab allows you to control generated mock data using JSDoc tags. You simply annotate your TypeScript interfaces with the `@faker` tag, and Fakelab uses the corresponding [Faker.js](https://fakerjs.dev/) method when generating mock values.

## Basic Usage

Annotate your interface properties with `@faker` tags:

```typescript
export interface User {
  /** @faker string.uuid */
  id: string;

  /** @faker person.fullName */
  name: string;

  /** @faker location.streetAddress */
  address: string;

  /** @faker phone.number */
  phone: string;

  /** @faker number.int({ min: 18, max: 65 }) */
  age: number;

  /** @faker datatype.boolean */
  admin: boolean;
}
```

## Function Calls

You can use Faker methods as functions to pass arguments:

```typescript
export interface Product {
  /** @faker number.int({ min: 1, max: 100 }) */
  price: number;

  /** @faker string.alphanumeric({ length: 10 }) */
  sku: string;

  /** @faker date.between({ from: '2020-01-01', to: '2024-12-31' }) */
  createdAt: Date;
}
```

## Supported Types

Fakelab supports:

- `interfaces`
- `types`
- `named export declarations`

### Example with Types

```typescript
export type Post = {
  /** @faker string.ulid */
  id: string;

  /** @faker lorem.sentence */
  title: string;

  /** @faker lorem.paragraph */
  content: string;
};
```

## Nested Types

Fakelab automatically handles nested types and arrays:

```typescript
export interface Comment {
  /** @faker string.uuid */
  id: string;

  /** @faker lorem.sentence */
  text: string;
}

export interface Post {
  /** @faker string.ulid */
  id: string;

  /** @faker lorem.sentence */
  title: string;

  comments: Comment[]; // Automatically generates array of Comment objects
}
```

## Type Imports

You can import and use types from other files:

```typescript
// other/post.ts
export type Post = {
  id: string;
  title: string;
};

// types/user.ts
import { type Post } from "../other/post";

export interface User {
  /** @faker string.uuid */
  id: string;

  /** @faker person.fullName */
  name: string;

  posts: Post[]; // Uses the imported Post type
}
```

## Common Faker Methods

### Strings

- `string.uuid` - UUID v4
- `string.ulid` - ULID
- `string.alphanumeric({ length: 10 })` - Alphanumeric string
- `string.alpha({ length: 5 })` - Alphabetic string
- `string.numeric({ length: 8 })` - Numeric string

### Person

- `person.fullName` - Full name
- `person.firstName` - First name
- `person.lastName` - Last name
- `person.email` - Email address
- `person.bio` - Biography

### Location

- `location.streetAddress` - Street address
- `location.city` - City name
- `location.country` - Country name
- `location.zipCode` - ZIP code
- `location.latitude` - Latitude
- `location.longitude` - Longitude

### Numbers

- `number.int({ min: 0, max: 100 })` - Integer
- `number.float({ min: 0, max: 100, precision: 0.01 })` - Float
- `number.bigInt({ min: 0n, max: 1000n })` - BigInt

### Dates

- `date.past()` - Past date
- `date.future()` - Future date
- `date.between({ from: '2020-01-01', to: '2024-12-31' })` - Date range
- `date.recent()` - Recent date

### Internet

- `internet.email()` - Email address
- `internet.url()` - URL
- `internet.userName()` - Username
- `internet.domainName()` - Domain name

### Lorem

- `lorem.word()` - Single word
- `lorem.words({ count: 5 })` - Multiple words
- `lorem.sentence()` - Sentence
- `lorem.paragraph()` - Paragraph

### Datatype

- `datatype.boolean` - Boolean
- `datatype.uuid` - UUID

## Best Practices

1. **Be Specific**: Use specific Faker methods that match your data needs
2. **Use Constraints**: Add min/max constraints for numbers and dates
3. **Document Complex Types**: Add comments for complex nested structures
4. **Reuse Types**: Import and reuse types across files
