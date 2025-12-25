---
sidebar_position: 2
---

# Configuration

Fakelab uses a configuration file to define how your mock server should behave.

## Configuration File

Create a `fakelab.config.ts` file in your project root:

```typescript
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types", "./fixtures/**/*.ts"], // supports glob pattern
  faker: { locale: "en" }, // optional
  server: { pathPrefix: "api/v1", port: 8080 }, // optional
  browser: { expose: { mode: "module" } }, // optional
  database: { enabled: true }, // optional
  network: { delay: [300, 1200] }, // optional
});
```

## Configuration Options

### `sourcePath`

An array of paths to TypeScript files or directories containing your type definitions.

- **Type:** `string | string[]`
- **Required:** Yes
- **Example:** `["./types", "./fixtures/**/*.ts"]`

Supports glob patterns for flexible file matching.

### `faker`

Configuration for Faker.js data generation.

- **Type:** `{ locale?: string }`
- **Required:** No
- **Default:** `{ locale: "en" }`

Available locales: `en`, `fr`, `de`, `es`, `pt`, `it`, `nl`, `pl`, `ru`, `ja`, `ko`, `zh_CN`, `zh_TW`, and more.

### `server`

Server configuration options.

- **Type:** `{ pathPrefix?: string, port?: number, includeSnapshots?: boolean }`
- **Required:** No
- **Default:** `{ pathPrefix: "api", port: 50000 }`

- `pathPrefix`: Prefix for all generated API routes
- `port`: Port number to run the server on
- `includeSnapshots` : Includes the snapshot typescript sources if exists.

### `browser`

Browser runtime configuration.

- **Type:** `{ expose?: { mode?: "module" | "global", name?: string } }`
- **Required:** No
- **Default:** `{ expose: { mode: "module" } }`

Controls how the Fakelab runtime is exposed in browser environments.

### `database`

Database persistence configuration.

- **Type:** `{ enabled?: boolean }`
- **Required:** No
- **Default:** `{ enabled: false }`

When enabled, Fakelab persists generated mock data to a local JSON database.

### `network`

Network simulation configuration.

- **Type:** `{ delay?: number | [number, number], errorRate?: number, timeoutRate?: number, offline?: boolean, preset?: string, presets?: Record<string, NetworkBehaviourOptions> }`
- **Required:** No

Simulate real-world network conditions:

- `delay`: Response delay in milliseconds (single value or range)
- `errorRate`: Probability of errors (0-1)
- `timeoutRate`: Probability of timeouts (0-1)
- `offline`: Force offline mode
- `preset`: Use a predefined network preset
- `presets`: Define custom network presets

## Example Configurations

### Basic Configuration

```typescript
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
});
```

### Advanced Configuration

```typescript
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./types", "./fixtures/**/*.ts"],
  faker: { locale: "fr" },
  server: {
    pathPrefix: "/api/v1",
    port: 4000,
  },
  database: { enabled: true },
  network: {
    delay: [200, 800],
    errorRate: 0.05,
    presets: {
      slow: { delay: [1000, 3000] },
      unreliable: { errorRate: 0.3 },
    },
    preset: "slow",
  },
});
```

## Next Steps

- [Faker Annotations](../guides/faker-annotations) - Learn how to annotate your types
- [Server Command](../guides/server-command) - Learn about the serve command
