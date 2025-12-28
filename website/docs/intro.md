---
sidebar_position: 1
---

# Introduction

**Fakelab** is a fast, easy-config mock API server for frontend developers. Generate realistic mock data from your TypeScript interfaces with Faker annotations.

## Why Fakelab?

- 🚀 **Instant Setup** - Get your mock server running in seconds
- 🗂️ **TypeScript First** - Use your existing types and interfaces
- 📦 **Lightweight** - Minimal dependencies, fast performance
- 🗄️ **Persistent Database** - Built-in database mode with seeding
- 📸 **Snapshot Real APIs** - Capture real API responses as mocks
- 🧪 **Perfect for Development** - Ideal for local development, prototyping, and frontend testing

## Quick Start

1. **Install Fakelab:**

```bash
npm install fakelab --save-dev
# or
pnpm add -D fakelab
# or
yarn add -D fakelab
```

2. **Create a configuration file:**

Create `fakelab.config.ts` in your project root:

```typescript
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: { port: 50001 },
});
```

3. **Define your types with Faker annotations:**

```typescript
// fixtures/user.ts
export interface User {
  /** @faker string.ulid */
  id: string;
  /** @faker person.fullName */
  name: string;
  /** @faker location.streetAddress */
  address: string;
  /** @faker phone.number */
  phone: string;
  /** @faker number.int({min:10,max:80}) */
  age: number;
}
```

4. **Start the server:**

```bash
npx fakelab serve
```

That's it! Your mock API is ready to use.

## What's Next?

- [Faker Annotations](./guides/faker-annotations) - Master Faker annotations
- [Runtime API](./guides/runtime-api) - Integrate Fakelab in your frontend code
