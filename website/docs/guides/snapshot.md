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

| Option            | Alias | Description                       |
| ----------------- | ----- | --------------------------------- |
| `--name <string>` | `-n`  | Name for the captured type        |
| `--update`        | `-u`  | Flag to force update the snapshot |

## Examples

### Capture a Single Endpoint

```bash
# Basic usage - Fakelab will infer the type name
npx fakelab snapshot https://jsonplaceholder.typicode.com/todos
```

### Specify a Type Name

```bash
# Give the captured type a specific name
npx fakelab snapshot https://jsonplaceholder.typicode.com/todos --name Todo
```

### Update Existing Snapshot

```bash
# Force update an existing snapshot
npx fakelab snapshot https://jsonplaceholder.typicode.com/todos --name Todo --update
```

### Update All Snapshots

```bash
# Update all existing snapshots
npx fakelab snapshot
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
2. **Update Regularly** - Use `--update` to keep snapshots in sync with API changes
3. **Version Control** - Commit snapshots to git for team consistency
4. **Combine with Annotations** - Add Faker annotations to generated types for dynamic data

## Limitations

- Snapshots capture the structure at the time of capture
- Nested objects and arrays are supported
- Complex types may need manual refinement

## Next Steps

- [Faker Annotations](./faker-annotations) - Add dynamic data generation to snapshots
- [Server Command](./server-command) - Start using your snapshots
