---
sidebar_position: 3
---

# Database Mode

Fakelab can persist generated mock data to a local database. This is useful for testing CRUD operations, maintaining state across development sessions, and simulating real database behavior.

## Overview

Under the hood, Fakelab uses the lightweight [lowdb](https://github.com/typicode/lowdb) library for persistence, ensuring:

- Fast reads and writes
- Simple JSON storage
- Zero external dependencies

## Enabling Database Mode

Enable database mode in your configuration:

```typescript
// fakelab.config.ts
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  database: { enabled: true },
});
```

## Basic Usage

### Getting Data

```typescript
import { database } from "fakelab/browser";

const users = await database.get("User");
console.log(users);
```

### Inserting Data

```typescript
import { database } from "fakelab/browser";

// Insert a single User
await database.post("User");

// Insert multiple Users
await database.post("User", 10);
```

## Database Seeding

Database seeding allows you to initialize your database with mock data.

### Seed Options

```typescript
type SeedOptions = {
  count?: number;
  strategy?: "reset" | "once" | "merge";
};
```

| Option     | Type                     | Description                                                                   |
| ---------- | ------------------------ | ----------------------------------------------------------------------------- |
| `count`    | `number`                 | Number of records to generate                                                 |
| `strategy` | `reset`, `once`, `merge` | Defines how seeding interacts with existing database data. Default is `reset` |

### Seed Strategies

#### `reset` (Default)

Removes all existing data and recreates it from scratch.

```typescript
import { database } from "fakelab/browser";

await database.seed("User", {
  count: 10,
  strategy: "reset",
});
```

#### `once`

Seeds data only if the database is empty. Useful for initial setup.

```typescript
import { database } from "fakelab/browser";

await database.seed("User", {
  count: 10,
  strategy: "once",
});
```

#### `merge`

Inserts new records and updates existing ones. The total number of items per table is limited to `1000` records.

```typescript
import { database } from "fakelab/browser";

await database.seed("User", {
  count: 5,
  strategy: "merge",
});
```

## Flushing Data

Clear all data from a specific table:

```typescript
import { database } from "fakelab/browser";

await database.flush("User");
```

## Complete Example

```typescript
import { database } from "fakelab/browser";
import type { User } from "./types/user";

// Seed initial data
await database.seed("User", {
  count: 10,
  strategy: "reset",
});

// Get all users
const users = await database.get<User[]>("User");
console.log("All users:", users);

// Add a new user
await database.post("User");
const updatedUsers = await database.get<User[]>("User");
console.log("Updated users:", updatedUsers);

// Clear all users
await database.flush("User");
const emptyUsers = await database.get<User[]>("User");
console.log("After flush:", emptyUsers); // []
```

## Database Storage

The database is stored as a JSON file in your project directory. The default location is:

```
.fakelab/db
```

This file is automatically created when database mode is enabled and data is inserted.

## Use Cases

### Testing CRUD Operations

```typescript
// Create
await database.post("User");

// Read
const users = await database.get("User");

// Update (via merge strategy)
await database.seed("User", { count: 1, strategy: "merge" });

// Delete (flush)
await database.flush("User");
```

### Maintaining State

Database mode allows you to maintain state across server restarts, making it perfect for:

- Testing stateful applications
- Simulating real database behavior
- Debugging data flow issues

### Development Workflow

```typescript
// On app startup
await database.seed("User", {
  count: 20,
  strategy: "once", // Only seed if empty
});

// During development, data persists
// You can modify data and it will remain until flushed
```

## Best Practices

1. **Use `once` strategy for initial seeding** - Prevents overwriting data on every app start
2. **Flush before tests** - Ensure clean state for each test run
3. **Limit merge operations** - Remember the 1000 record limit per table
4. **Commit database file to git** - For consistent development environments (optional)

## Next Steps

- [Runtime API](./runtime-api) - Learn about the full runtime API
- [Network Simulation](./network-simulation) - Add network simulation to your mocks
