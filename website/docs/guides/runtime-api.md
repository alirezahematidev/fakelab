---
sidebar_position: 2
---

# Runtime API

Fakelab provides a runtime API that enables your frontend or Node environment to communicate with the running Fakelab mock server.

## Installation

The runtime API is available through the `fakelab/browser` module:

```typescript
import { fakelab } from "fakelab/browser";
```

Or enable it as a global object:

```typescript
import "fakelab/browser";

// Now fakelab is available globally
const users = await fakelab.fetch("User", 10);
```

## `fakelab.url()`

Get the base URL of the running Fakelab server.

```typescript
const baseUrl = fakelab.url();
// e.g. "http://localhost:50000/api"
```

## `fakelab.fetch()`

Fetch mock data from the Fakelab server by TypeScript interface/type name.

### Signature

```typescript
fakelab.fetch<T>(name: string, count?: number): Promise<T>
```

### Parameters

| Name    | Type     | Description                            |
| ------- | -------- | -------------------------------------- |
| `name`  | `string` | Interface/Type name                    |
| `count` | `number` | Number of items to generate (optional) |

### Basic Example

```typescript
import { fakelab } from "fakelab/browser";

// Fetch a single User
const user = await fakelab.fetch("User");
console.log(user);

// Fetch multiple Users
const users = await fakelab.fetch("User", 10);
console.log(users);

// Get an empty array (use negative count)
const emptyUsers = await fakelab.fetch("User", -1);
console.log(emptyUsers); // []
```

### With TypeScript Types

```typescript
import { fakelab } from "fakelab/browser";
import type { User } from "./types/user";

const users = await fakelab.fetch<User[]>("User", 5);
// users is typed as User[]
```

## Database API

When database mode is enabled, you can use the database API to persist and manage mock data.

### `database.get()`

Retrieve data from the database.

```typescript
import { database } from "fakelab/browser";

const users = await database.get("User");
console.log(users);
```

### `database.post()`

Insert fresh data into the database.

```typescript
import { database } from "fakelab/browser";

// Insert a single User
await database.post("User");

// Insert multiple Users
await database.post("User", 10);
```

### `database.seed()`

Seed the database with initial data.

```typescript
import { database } from "fakelab/browser";

await database.seed("User", {
  count: 10,
  strategy: "once", // or "reset" or "merge"
});
```

#### Seed Strategies

- `reset`: Removes all existing data and recreates it from scratch
- `once`: Seeds data only if the database is empty
- `merge`: Inserts new records and updates existing ones (limited to 1000 records per table)

### `database.flush()`

Clear all data from a specific table.

```typescript
import { database } from "fakelab/browser";

await database.flush("User");
```

## Integration Examples

### React Example

```typescript
import { useEffect, useState } from "react";
import { fakelab } from "fakelab/browser";
import type { User } from "./types/user";

function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const data = await fakelab.fetch<User[]>("User", 10);
      setUsers(data);
    }
    loadUsers();
  }, []);

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Vue Example

```vue
<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { fakelab } from "fakelab/browser";
import type { User } from "./types/user";

const users = ref<User[]>([]);

onMounted(async () => {
  users.value = await fakelab.fetch<User[]>("User", 10);
});
</script>
```

### Next.js Example

```typescript
// app/users/page.tsx
import { fakelab } from "fakelab/browser";
import type { User } from "@/types/user";

export default async function UsersPage() {
  const users = await fakelab.fetch<User[]>("User", 10);

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Error Handling

```typescript
import { fakelab } from "fakelab/browser";

try {
  const users = await fakelab.fetch("User", 10);
  console.log(users);
} catch (error) {
  console.error("Failed to fetch users:", error);
}
```

## Next Steps

- [Database Mode](./database-mode) - Learn more about database features
- [Network Simulation](./network-simulation) - Simulate network conditions

