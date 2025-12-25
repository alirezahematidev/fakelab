---
sidebar_position: 6
---

# Server Command

The `fakelab serve` command starts the Fakelab mock server. You can use it with or without a configuration file.

## Usage

```bash
npx fakelab serve [options]
```

## Options

| Option                  | Alias | Description                                           |
| ----------------------- | ----- | ----------------------------------------------------- |
| `--source`              | `-s`  | Path to the source TypeScript file(s) or directory(s) |
| `--pathPrefix <prefix>` | `-x`  | Prefix for all generated API routes                   |
| `--locale <locale>`     | `-l`  | Locale used for fake data generation                  |
| `--port <number>`       | `-p`  | Port to run the server on                             |

## Examples

### Basic Usage

Start the server using the configuration file:

```bash
npx fakelab serve
```

### Custom Source and Port

```bash
npx fakelab serve -s ./types -p 4000
```

### Custom API Prefix and Locale

```bash
npx fakelab serve --pathPrefix /v1 --locale fr
```

### Multiple Sources

```bash
npx fakelab serve -s ./types -s ./fixtures
```

### Complete Example

```bash
npx fakelab serve \
  --source ./types \
  --source ./fixtures \
  --pathPrefix /api/v1 \
  --locale en \
  --port 8080
```

## Command Line vs Configuration File

Options provided via command line override configuration file settings:

```bash
# Configuration file specifies port 50000
# Command line overrides to 4000
npx fakelab serve -p 4000
```

## Server Output

When the server starts, you'll see output like:

```
✓ Fakelab server started
  Server running on: http://localhost:50000
  API prefix: /api
  Locale: en

  Available endpoints:
  - GET  /api/User
  - GET  /api/Post
  - POST /api/User
  - POST /api/Post
```

## API Endpoints

Fakelab automatically generates REST endpoints for each type:

- `GET /api/{TypeName}` - Fetch mock data (supports `?count=N` query parameter)
- `POST /api/{TypeName}` - Insert data into database (if enabled)

### Example Requests

```bash
# Fetch a single User
curl http://localhost:50000/api/User

# Fetch 10 Users
curl http://localhost:50000/api/User?count=10

# Insert a User (database mode)
curl -X POST http://localhost:50000/api/User
```

## Environment Variables

You can also configure the server using environment variables:

```bash
FAKELAB_SOURCE=./types \
FAKELAB_PORT=4000 \
FAKELAB_PATH_PREFIX=/api/v1 \
FAKELAB_LOCALE=fr \
npx fakelab serve
```

## Integration with npm scripts

Add Fakelab to your `package.json`:

```json
{
  "scripts": {
    "mock": "fakelab serve",
    "mock:dev": "fakelab serve -p 4000 -s ./fixtures"
  }
}
```

Then run:

```bash
npm run mock
# or
npm run mock:dev
```

## Troubleshooting

### Port Already in Use

If the port is already in use, Fakelab will show an error:

```
Error: Port 50000 is already in use
```

Solution: Use a different port with `-p`:

```bash
npx fakelab serve -p 50001
```

### No Types Found

If no types are found, check:

1. Source path is correct
2. TypeScript files contain exported interfaces/types
3. Files are included in the source path

### Server Not Responding

Check:

1. Server is running (check terminal output)
2. Correct port number
3. Correct API prefix
4. Network/firewall settings

## Next Steps

- [Configuration](../getting-started/configuration) - Learn about configuration options
- [Runtime API](./runtime-api) - Use Fakelab in your frontend code
