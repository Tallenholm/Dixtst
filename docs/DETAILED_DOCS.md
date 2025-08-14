# Detailed Documentation

This guide provides an in-depth overview of the Dixtst monorepo and how to work with its different pieces.

## Repository Overview

The repository is organized around a **Circadian Hue** lighting system that consists of a web client, mobile app, and Node.js backend.  At the root you will also find supporting scripts and lightweight examples used for testing.

```
Dixtst/
├── circadian-hue/   # Main application (web client, server and mobile app)
├── server/          # Lightweight standalone services and tests
├── examples/        # Simple examples used in CI and documentation
└── docs/            # Project documentation
```

### circadian-hue

The `circadian-hue` directory contains the primary application.  It includes:

- `client/` – React web interface for controlling the system
- `server/` – Express backend that talks to Philips Hue bridges
- `mobile/` – React Native/Expo client
- `shared/` – Shared TypeScript types
- `scripts/` – Utility scripts for building and deployment

For full instructions on the main application see [`circadian-hue/README.md`](../circadian-hue/README.md).

### server

The root `server` directory includes a small set of services and tests used in the introductory examples.  They demonstrate the Hue bridge service, a circadian engine, and simple storage helpers.  The tests in `server/__tests__` exercise these pieces with the `tsx` test runner.

### examples

The `examples` folder holds minimal JavaScript examples used for illustrating testing conventions.  They are executed as part of the main `npm test` script.

## Getting Started

### Install Dependencies

From the repository root install dependencies with:

```bash
npm install
```

This installs dependencies for the root scripts and the example server.  The `circadian-hue` project manages its own dependencies; see its README for instructions.

### Run Tests

Use the following command to run all tests in the monorepo:

```bash
npm test
```

This command runs the unit tests under `server/__tests__` and a small check for the mobile app located at `circadian-hue/mobile/test-mobile.js`.

### Development Workflow

- **Web client & backend:** `npm run dev` (delegates to `circadian-hue`)
- **Build for production:** `npm run build`
- **Preview build:** `npm run preview`

### Mobile App

The React Native mobile client reads the backend URL from the `SERVER_URL` environment variable.  Set it before starting the Expo development server:

```bash
cd circadian-hue/mobile
export SERVER_URL="http://localhost:5000"
npm start
```

Refer to [`circadian-hue/mobile/README.md`](../circadian-hue/mobile/README.md) for more detailed information about building and testing the mobile application.

## Additional Resources

- [Circadian Hue README](../circadian-hue/README.md) – feature overview and architecture
- [Test Mobile Guide](../circadian-hue/TEST_MOBILE_APP.md) – manual testing steps for the Android app

---

If you encounter issues or have ideas for improvements, feel free to open an issue or pull request.
