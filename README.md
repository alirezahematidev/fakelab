# Fakelab

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
  sourcePath: "./interfaces", // can set a directory or a single typescript file.
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

## Start the mock api server

Run:

```bash
npx fakelab serve
```

## Related

Fakelab is powered by [Fakerjs](https://fakerjs.dev/) library.

## License

[MIT](https://choosealicense.com/licenses/mit/)
