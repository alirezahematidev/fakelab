---
sidebar_position: 6
---

# Webhooks

Webhooks allow Fakelab to notify external services when specific events occur.
Each webhook listens to an internal event and sends a **POST** request with the event payload (or a transformed payload) to a configured HTTP endpoint.

This is useful for integrations such as notifications, automation, logging, or triggering workflows in external systems.

## Overview

Webhook hooks subscribe to Fakelab events and dispatch HTTP requests when those events are triggered.

By default:

- Requests are sent as `POST`
- Payloads are serialized as `application/json`
- Webhooks run asynchronously and never block the main process

## Configuration

Enable webhooks and define hooks in your Fakelab configuration file:

```ts
// fakelab.config.ts
import { defineConfig } from "fakelab";

export default defineConfig({
  webhook: {
    enabled: true,
    hooks: [
      {
        name: "snapshot-captured",
        trigger: {
          event: "snapshot:captured",
        },
        method: "POST",
        url: "https://example.com/webhooks/snapshot",
        headers: {
          Authorization: "Bearer YOUR_TOKEN",
        },
        transform: (data) => ({
          id: data.id,
          createdAt: data.createdAt,
        }),
      },
    ],
  },
});
```

### Hook Options

| Name        | Type                           | Description                                  |
| ----------- | ------------------------------ | -------------------------------------------- |
| `name`      | `string`                       | Unique name used for logging and debugging   |
| `trigger`   | `{ event: TriggerEvent }`      | Event that triggers the webhook              |
| `method`    | `POST`                         | HTTP method (only POST is supported)         |
| `url`       | `string`                       | Target webhook endpoint (must be HTTP/HTTPS) |
| `headers`   | `HttpHeaders (optional)`       | Custom HTTP headers                          |
| `transform` | `(data) => unknown (optional)` | Transform event payload before sending       |

### Payload Transformation

By default, the raw event payload is sent to the webhook endpoint.

You can customize the payload using the `transform` function:

```ts
transform: (data) => ({
  ...data,
  createdAt: new Date().toISOString(),
});
```

### Webhook Delivery

When an event is triggered:

1. Event Fired – Fakelab emits an internal event
2. Hook Matched – Webhooks subscribed to the event are selected
3. Payload Prepared – Optional transform is applied
4. Request Sent – POST request is sent to the configured URL
5. Response Evaluated – Success or failure is logged

### Best Practices

1. Use descriptive hook names for better logs
2. Validate endpoints before enabling webhooks
3. Keep transforms simple and deterministic
4. Avoid heavy logic inside transforms
5. Version control configs for team consistency

### Use Cases

Notify External Services:

```ts
{
  name: "notify-slack",
  trigger: { event: "snapshot:captured" },
  method: "POST",
  url: "https://hooks.slack.com/services/XXX",
  transform: (data) => ({
    text: `Snapshot created: ${data.name}`,
  }),
}
```

Trigger CI / Automation:

```ts
{
  name: "trigger-ci",
  trigger: { event: "server:started" },
  method: "POST",
  url: "https://ci.example.com/webhook",
}
```
