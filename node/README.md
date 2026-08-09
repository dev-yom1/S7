# Salta7 CLI — Node.js implementation

Experimental Node.js 22+ implementation that mirrors the Python CLI's API client and transport safety rules.

## Requirements

- Node.js 22 or newer
- No runtime npm dependencies

## Run

```bash
cd node
npm test
npm run check
node ./bin/s7.js --help
```

Examples:

```bash
SALTA7_TOKEN=... node ./bin/s7.js balance
node ./bin/s7.js prices
node ./bin/s7.js stock discord-1m-nitro
SALTA7_TOKEN=... node ./bin/s7.js task status JOB_ID
node ./bin/s7.js update --check
```

HTTP is rejected by default. For local development only:

```bash
node ./bin/s7.js --base-url http://127.0.0.1:8000 --allow-insecure-http prices
```

The initial executable name is `s7-node` so it can coexist with the Python `s7` command during development.
