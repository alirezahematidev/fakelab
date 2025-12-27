---
sidebar_position: 5
---

# Network Simulation

Fakelab can simulate real-world network conditions such as latency, random failures, timeouts, and offline mode. This is useful for testing loading states, retry logic, and poor network UX without changing frontend code.

## Overview

Network simulation helps you test how your application behaves under various network conditions, ensuring a robust user experience even when the network is unreliable.

## Configuration

### Basic Network Options

```typescript
type NetworkErrorOptions = {
  statusCodes?: ErrorStatusCode[];
  messages?: Record<ErrorStatusCode, string>;
};

type NetworkBehaviourOptions = {
  delay?: number | [number, number];
  errorRate?: number;
  timeoutRate?: number;
  offline?: boolean;
  errors?: NetworkErrorOptions;
};

export type NetworkOptions = NetworkBehaviourOptions & {
  preset?: string;
  presets?: Record<string, NetworkBehaviourOptions>;
};
```

## Basic Example

```typescript
// fakelab.config.ts
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  network: {
    delay: [300, 1200], // Random delay between 300ms and 1200ms
    errorRate: 0.1, // 10% chance of errors
    timeoutRate: 0.05, // 5% chance of timeouts
  },
});
```

## Network Options

### Delay

Simulate network latency with fixed or random delays.

```typescript
// Fixed delay
network: {
  delay: 500, // Always 500ms delay
}

// Random delay range
network: {
  delay: [300, 1200], // Random delay between 300ms and 1200ms
}
```

### Error Rate

Simulate random network errors.

```typescript
network: {
  errorRate: 0.1, // 10% chance of returning an error
  errors: {
    statusCodes: [400, 404, 500] // Random error status code
    messages: {
      400: "Bad request",
      404: "Not found",
      500: "Server error"
    } // Custom messages per status code
  }
}
```

### Timeout Rate

Simulate request timeouts.

```typescript
network: {
  timeoutRate: 0.05, // 5% chance of timing out
}
```

### Offline Mode

Force all requests to fail (simulating offline state).

```typescript
network: {
  offline: true, // All requests will fail
}
```

## Network Presets

Define reusable network presets for different scenarios.

### Defining Presets

```typescript
// fakelab.config.ts
import { defineConfig } from "fakelab";

export default defineConfig({
  sourcePath: ["./fixtures"],
  network: {
    presets: {
      wifi: {
        delay: [50, 200],
        errorRate: 0.01,
      },
      "3g": {
        delay: [500, 2000],
        errorRate: 0.05,
      },
      "slow-3g": {
        delay: [2000, 5000],
        errorRate: 0.1,
      },
      offline: {
        offline: true,
      },
      unreliable: {
        delay: [100, 500],
        errorRate: 0.3,
        timeoutRate: 0.2,
      },
    },
    preset: "wifi", // Use the wifi preset
  },
});
```

### Using Presets

```typescript
network: {
  preset: "slow-3g", // Activate the slow-3g preset
}
```

## Preset Override

When both inline network options and a `preset` are defined, inline options always take precedence and override the preset values.

```typescript
network: {
  presets: {
    wifi: {
      delay: [50, 200],
      errorRate: 0.01,
    },
  },
  preset: "wifi",
  delay: [1000, 3000], // This overrides the wifi preset delay
}
```

## Common Use Cases

### Testing Loading States

```typescript
network: {
  delay: [1000, 3000], // Simulate slow network
}
```

This helps you test:

- Loading spinners
- Skeleton screens
- Progress indicators

### Testing Error Handling

```typescript
network: {
  errorRate: 0.2, // 20% chance of errors
}
```

This helps you test:

- Error messages
- Retry logic
- Fallback UI

### Testing Timeout Handling

```typescript
network: {
  timeoutRate: 0.1, // 10% chance of timeouts
}
```

This helps you test:

- Timeout error handling
- Request cancellation
- User feedback

### Testing Offline Mode

```typescript
network: {
  offline: true,
}
```

This helps you test:

- Offline detection
- Cached data display
- Offline messaging

## Example Scenarios

### Development Environment

```typescript
// fakelab.config.ts
export default defineConfig({
  sourcePath: ["./fixtures"],
  network: {
    delay: [100, 300], // Fast, realistic delays
    errorRate: 0.01, // Rare errors
  },
});
```

### Testing Environment

```typescript
// fakelab.config.ts
export default defineConfig({
  sourcePath: ["./fixtures"],
  network: {
    presets: {
      "test-fast": { delay: 0 },
      "test-slow": { delay: [2000, 5000] },
      "test-unreliable": { errorRate: 0.5 },
    },
    preset: "test-fast", // Fast for most tests
  },
});
```

### Production-like Testing

```typescript
// fakelab.config.ts
export default defineConfig({
  sourcePath: ["./fixtures"],
  network: {
    delay: [200, 800], // Realistic production delays
    errorRate: 0.02, // Occasional errors
    timeoutRate: 0.01, // Rare timeouts
  },
});
```

## Best Practices

1. **Use Presets** - Define presets for common scenarios
2. **Test Edge Cases** - Use high error/timeout rates to test error handling
3. **Match Real Conditions** - Use realistic delay ranges based on your target network
4. **Document Presets** - Document what each preset simulates

## Next Steps

- [Server Command](./server-command) - Learn about the serve command
- [Configuration](../getting-started/configuration) - Review all configuration options
