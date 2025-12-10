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
});
```

interfaces folder:

```typescript
export interface User {
  name: string;
  age: number;
  admin: boolean;
  address: string;
  tags: string[];
}
export interface User {
  gender: "male" | "female";
}
export interface Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
}

export interface Profile {
  id: string;
  bio: string;
  user: User;
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
