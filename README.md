# ![logo](https://raw.githubusercontent.com/alirezahematidev/fakelab/refs/heads/main/src/public/icons/logo24.svg) Fakelab

⚡ A fast, easy-config mock API server for frontend developers.

## Features

- 🚀 Instant mock server
- 🗂️ Mock from Typescript files
- 📦 Lightweight ~ 653 kB
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

create `fakelab.config.ts` file in the project root. and reference your app interfaces files.

```typescript
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: "./interfaces", // can set one/multiple directory(s) or typescript file(s).
  faker: { locale: "en" }, // optional
  server: { pathPrefix: "api/v1", port: 8080 }, // optional
});
```

Fakelab allows you to control generated mock data using JSDoc tags.
You simply annotate your TypeScript interfaces with the @faker tag, and Fakelab uses the corresponding [faker](https://fakerjs.dev/)
method when generating mock values.

`/interfaces/user.ts`:

```typescript
export interface User {
  /** @faker string.uuid */
  id: string;

  /** @faker person.fullName */
  name: string;

  /** @faker number.int */
  age: number;

  /** @faker datatype.boolean */
  admin: boolean;

  /** @faker location.streetAddress */
  address: string;

  /** @faker word.words */
  tags: string[];
}
```

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
npx fakelab serve -s ./interfaces -p 4000

# Custom API prefix and locale
npx fakelab serve --pathPrefix /v1 --locale fr
```

## Related

Fakelab is powered by [Fakerjs](https://fakerjs.dev/) library.

## License

[MIT](https://choosealicense.com/licenses/mit/)
