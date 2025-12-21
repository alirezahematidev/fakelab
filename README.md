# ![logo](https://raw.githubusercontent.com/alirezahematidev/fakelab/refs/heads/main/src/public/icons/logo24.svg) Fakelab

⚡ A fast, easy-config mock API server for frontend developers.

## Features

- 🚀 Instant mock server
- 🗂️ Mock from Typescript files
- 📦 Lightweight ~ 665 kB
- 🧪 Perfect for local development, prototyping, and frontend testing

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
  sourcePath: ["./types", "./fixtures/**/*.ts"], // supports glob pattern
  faker: { locale: "en" }, // optional
  server: { pathPrefix: "api/v1", port: 8080 }, // optional
  browser: { expose: { mode: "module" } }, // optional
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

`fakelab/runtime` enables `fakelab` module at runtime, allowing your frontend or Node environment to communicate with the running Fakelab mock server.

## `fakelab.url()`

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
import { fakelab } from "fakelab/runtime";

const users = await fakelab.fetch("User", 10);

console.log(users);

// or

// can be enabled as a global object
import "fakelab/runtime";

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
  dest?: string;
};
```

### Basic example

```ts
export default defineConfig({
  database: { enabled: true, dest: "db" },
});
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

Run:

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

## License

[MIT](https://choosealicense.com/licenses/mit/)
