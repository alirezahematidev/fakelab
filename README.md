# ![logo](https://raw.githubusercontent.com/alirezahematidev/fakelab/refs/heads/main/src/public/icons/logo24.svg) Fakelab

⚡ A fast, easy-config mock API server for frontend developers.

## Features

- 🚀 Instant mock server
- 🗂️ Mock from Typescript files
- 📦 Lightweight
- 🗄️ Persistent database
- 📸 Snapshot real APIs into mocks
- 🧪 Perfect for local development, prototyping, and frontend testing

## Demo

Check out the [React + TypeScript + Vite example](./examples/react-typescript-vite) to see Fakelab in action!


### Quick Demo

1. Define your types with Faker annotations:

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

2. Configure Fakelab:

```typescript
// fakelab.config.ts
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures/**/*.ts"],
  server: { port: 8080 },
});
```

3. Run the example:

```bash
npm run example
# or
yarn example
# or
pnpm run example
```

Or start the server manually:

`./examples/react-typescript-vite`:

```bash
npx fakelab serve
```

4. Use in your frontend:

```typescript
import { fakelab } from "fakelab/browser";

const users = await fakelab.fetch("User", 10);
console.log(users); // Array of 10 mock users
```

## Installation

```bash
npm install fakelab --save-dev
# or
pnpm add -D fakelab
# or
yarn add -D fakelab
```

## Usage/Examples

create `fakelab.config.ts` file in the project root. and reference your typescript files.

```typescript
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: { port: 50001 },
  network: { delay: [500, 1500] },
});

```

## Faker Annotations

Fakelab allows you to control generated mock data using JSDoc tags.
You simply annotate your TypeScript interfaces with the @faker tag, and Fakelab uses the corresponding [faker](https://fakerjs.dev/)
method when generating mock values.

`/other/post.ts`:

```typescript
export type Post = {
  id: string;
  title: string;
};
```

`/other/profile.ts`:

```typescript
export type Profile = {
  id: string;
};
```

`/types/user.ts`:

```typescript
export { type Profile } from "../other/profile";
import { type Post } from "../other/post";

export interface User {
  /** @faker string.uuid */
  id: string;

  /** @faker person.fullName */
  name: string;

  // Use it as a function to pass the arguments.
  /** @faker number.int({ max: 10 }) */
  age: number;

  /** @faker datatype.boolean */
  admin: boolean;

  /** @faker location.streetAddress */
  address: string;

  posts: Post[];
}
```

**NOTE:** Fakelab only supports `interfaces`, `types`, `named export declarations`.

## Fakelab Runtime

`fakelab/browser` enables `fakelab` module at runtime, allowing your frontend or Node environment to communicate with the running Fakelab mock server.

## `fakelab.url`

The base URL of the running Fakelab server.

```ts
fakelab.url();
// e.g. "http://localhost:50000/api"
```

## `fakelab.fetch`

Fetch mock data from the Fakelab server by **typescript interface/type name**.

### Signature

```ts
fakelab.fetch(name: string, count?: number): Promise<T>
```

### Parameters

| Name    | Type     | Description                            |
| ------- | -------- | -------------------------------------- |
| `name`  | `string` | Interface/Type name                    |
| `count` | `number` | Number of items to generate (optional) |

### Basic example

```ts
import { fakelab } from "fakelab/browser";

const users = await fakelab.fetch("User", 10);

console.log(users);

// or

// can be enabled as a global object
import "fakelab/browser";

const users = await fakelab.fetch("User", 10);

console.log(users);
```

**NOTE:** Set count to a negative number to get an empty array.

## Database Mode

Fakelab can persist generated mock data to a local database.

Under the hood, Fakelab uses the lightweight [lowdb](https://github.com/typicode/lowdb)
library for persistence, ensuring fast reads, simple JSON storage, and zero external dependencies.

### Database Options

```ts
export type DatabaseOptions = {
  enabled: boolean;
};
```

### Basic example

```ts
export default defineConfig({
  database: { enabled: true },
});

import { database } from "fakelab/browser";

const users = await database.get("User");

console.log(users);

// or insert fresh data to database
await database.post("User");
```

### Database Seeding

Fakelab supports database seeding to initialize mock data.

```ts
type SeedOptions = {
  count?: number;
  strategy?: "reset" | "once" | "merge";
};
```

### Options

| Name       | Type                     | Description                                                                   |
| ---------- | ------------------------ | ----------------------------------------------------------------------------- |
| `count`    | `number`                 | Number of records to generate                                                 |
| `strategy` | `reset`, `once`, `merge` | Defines how seeding interacts with existing database data. default is `reset` |

- `reset`: Removes all existing data and recreates it from scratch.
- `once`: Seeds data only if the database is empty.
- `merge`: Inserts new records and updates existing ones. The total number of items per table is limited to `1000` records.

### Basic example

```ts
export default defineConfig({
  database: { enabled: true },
});

import { database } from "fakelab/browser";

await database.seed("User", { count: 10, strategy: "once" });

// to flush the database
await database.flush("User");
```

## Snapshot

The snapshot command allows you to capture a real API response and turn it into a reusable mock source.

This is useful when you want to:

- Bootstrap mocks from an existing API

- Freeze API responses for offline development

- Generate realistic mock data without writing schemas manually

### Snapshot Options

```ts
export type SnapshotOptions = {
  enabled: boolean;
};
```

### Usage

```bash
# Basic usage
npx fakelab snapshot [url] [options]
```

### Options

| Option            | Alias | Description                       |
| ----------------- | ----- | --------------------------------- |
| `--name <string>` | `-n`  | name for the captured type        |
| `--update`        | `-u`  | flag to force update the snapshot |

### Examples

```bash
# Basic usage
npx fakelab snapshot https://jsonplaceholder.typicode.com/todos

# consider a name for captured type
npx fakelab snapshot https://jsonplaceholder.typicode.com/todos --name Todo

# add --update flag to force update the existing snapshot
npx fakelab snapshot https://jsonplaceholder.typicode.com/todos --name Todo --update


# update all existing snapshots
npx fakelab snapshot
```

## Network Simulation

Fakelab can simulate real-world network conditions such as latency, random failures, timeouts, and offline mode.
This is useful for testing loading states, retry logic, and poor network UX without changing frontend code.

### Network Options

```ts
type NetworkBehaviourOptions = {
  delay?: number | [number, number];
  errorRate?: number;
  timeoutRate?: number;
  offline?: boolean;
};

export type NetworkOptions = NetworkBehaviourOptions & {
  preset?: string;
  presets?: Record<string, NetworkBehaviourOptions>;
};
```

### Basic example

```ts
export default defineConfig({
  network: {
    delay: [300, 1200],
    errorRate: 0.1,
    timeoutRate: 0.05,
    presets: { wifi: { errorRate: 1 } },
    preset: "wifi",
  },
});
```

**NOTE:** When both inline network options and a `preset` are defined, inline options always take precedence and override the preset values.

## Server Command

Usage:

```bash
npx fakelab serve [options]
```

### Options

| Option                  | Alias | Description                                           |
| ----------------------- | ----- | ----------------------------------------------------- |
| `--source`              | `-s`  | Path to the source typescript file(s) or directory(s) |
| `--pathPrefix <prefix>` | `-x`  | Prefix for all generated API routes                   |
| `--locale <locale>`     | `-l`  | Locale used for fake data generation                  |
| `--port <number>`       | `-p`  | Port to run the server on                             |

### Examples

```bash
# Basic usage
npx fakelab serve

# Custom source and port
npx fakelab serve -s ./types -p 4000

# Custom API prefix and locale
npx fakelab serve --pathPrefix /v1 --locale fr
```

## Related

Fakelab is powered by [Fakerjs](https://fakerjs.dev/) library.
