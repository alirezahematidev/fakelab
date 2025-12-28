---
sidebar_position: 4
---

# Snapshot

The snapshot command allows you to capture a real API response and turn it into a reusable mock source. This is useful when you want to bootstrap mocks from an existing API, freeze API responses for offline development, or generate realistic mock data without writing schemas manually.

## Overview

Snapshots capture real API responses and convert them into TypeScript type definitions that Fakelab can use. This eliminates the need to manually write type definitions for existing APIs.

## Usage

### Basic Usage

```bash
npx fakelab snapshot [url] [options]
```

### Options

| Option               | Alias | Description                    |
| -------------------- | ----- | ------------------------------ |
| `--name <string>`    | `-n`  | specify snapshot source name   |
| `--refresh <string>` | `-r`  | refresh the specified snapshot |
| `--delete <string>`  | `-d`  | delete the specified snapshot  |

## Examples

### Capture a Single Endpoint

```bash
# Basic usage
npx fakelab snapshot https://jsonplaceholder.typicode.com/todos
```

### Specify a Source Name

```bash
# Give the captured type a specific name
npx fakelab snapshot https://jsonplaceholder.typicode.com/todos --name Todo
```

### Update Existing Snapshot

```bash
# Refresh an existing snapshot
npx fakelab snapshot --refresh Todo
```

### Delete Existing Snapshot

```bash
# Delete an existing snapshot
npx fakelab snapshot --delete Todo
```

### Update All Snapshots

```bash
# Update all existing snapshots
npx fakelab snapshot
```

Also can define snapshot sources in config, run `npx fakelab snapshot` command to capture them all:

```ts
export default defineConfig({
  sourcePath: ["./fixtures"],
  server: { includeSnapshots: true },
  snapshot: {
    enabled: true,
    sources: [
      {
        name: "Todo",
        url: "https://jsonplaceholder.typicode.com/todos",
      },
      {
        name: "Post",
        url: "https://jsonplaceholder.typicode.com/posts",
      },
    ],
  },
});
```

## How It Works

1. **Fetch the API** - Fakelab makes a request to the specified URL
2. **Analyze Response** - The response structure is analyzed
3. **Generate Types** - TypeScript type definitions are generated
4. **Save Snapshot** - The snapshot is saved to your project

## Snapshot Storage

Snapshots are stored in your project directory:

```
.fakelab/snapshots/
  ├── api_example_com_todos.ts
  └── api_example_com_users.ts
```

## Generated Types

Fakelab automatically generates TypeScript types from the API response:

```typescript
// .fakelab/snapshots/api_example_com_todos.ts (generated)
export interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
```

## Use Cases

### Bootstrap from Existing API

When starting a new project, you can quickly bootstrap mocks from your backend API:

```bash
npx fakelab snapshot https://api.example.com/users --name User
npx fakelab snapshot https://api.example.com/posts --name Post
```

### Freeze API Responses

Capture API responses for offline development:

```bash
# Capture current API state
npx fakelab snapshot https://api.example.com/products --name Product

# Now you can develop offline using the captured snapshot
```

### Generate Realistic Data

Instead of manually writing type definitions, capture real API responses:

```bash
npx fakelab snapshot https://jsonplaceholder.typicode.com/users --name User
```

## Integration with Configuration

After creating snapshots, enable `includeSnapshots` in your server configuration:

```typescript
// fakelab.config.ts
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  server: {
    includeSnapshots: true, // Include snapshots
  },
});
```

## Best Practices

1. **Use Descriptive Names** - Use `--name` to give meaningful names to captured types
2. **Update Regularly** - Use `--refresh` to keep a specific snapshot in sync with API changes
3. **Delete Source** - Use `--delete` to delete a specific snapshot
4. **Version Control** - Commit snapshots to git for team consistency
5. **Combine with Annotations** - Add Faker annotations to generated types for dynamic data

## Limitations

- Snapshots capture the structure at the time of capture
- Nested objects and arrays are supported
- Complex types may need manual refinement
