# Dixtst

Monorepo for the **Circadian Hue** smart lighting system. It contains a web client, React Native mobile app, and Node.js services for controlling Philips Hue lights.

For an in-depth overview of the repository structure and development workflow, see the [detailed documentation](docs/DETAILED_DOCS.md).

## Quick Start

### Install Dependencies

```bash
npm install
```

### Configure Environment

Generate a `.env` file from the example template:

```bash
npm run setup-env
```

Follow the prompt to set your `DATABASE_URL` or accept the default.

### Development

Common tasks are exposed through npm scripts:

- `npm run dev` – start the web client and backend in development mode
- `npm run build` – build the project for production
- `npm run preview` – serve the production build locally

### Docker Compose

The repository includes a `docker-compose.yml` for running the server alongside a PostgreSQL database.

```bash
docker compose up
```

This command builds the server container and starts a PostgreSQL service. The server's `DATABASE_URL` environment variable is preconfigured to point at the bundled database, so the app is available on <http://localhost:3000> with no additional setup.

## Testing

Run the tests locally with:

```bash
npm test
```

This executes the unit tests under `server/__tests__` and a simple mobile check.

## Mobile App

The React Native client reads the server base URL from the `SERVER_URL` environment variable. Set it before starting the Expo development server:

```bash
cd circadian-hue/mobile
export SERVER_URL="http://localhost:5000"
npm start
```

More detailed instructions are available in [`circadian-hue/mobile/README.md`](circadian-hue/mobile/README.md).
