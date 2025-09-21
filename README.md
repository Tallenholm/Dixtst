# Dixtst Circadian Hue — Home Edition

The Home Edition of Dixtst Circadian Hue is a streamlined, single-service application for managing Philips Hue lighting with circadian automation. It keeps the original web dashboard, scheduling tools, lighting effects, and scene management while removing enterprise and mobile features so the system can run reliably on home hardware such as a Raspberry Pi or NAS.

## Highlights

- **Circadian automation** – Automatic sunrise/sunset calculations with smooth transitions between night, dawn, day, and dusk phases.
- **Philips Hue integration** – Native control of bridges, rooms, groups, scenes, and individual lights using the official Hue API.
- **React web dashboard** – Full-featured interface for real-time status, light controls, effects, schedules, and configuration.
- **Lighting effects** – Eight ambient and dynamic effects (Breathing, Rainbow Cycle, Fireplace, Ocean Waves, Northern Lights, Party Pulse, Meditation, Sunrise Simulation).
- **Custom presets & scenes** – Focus/Relax/Cozy/Bright presets plus access to scenes stored on the Hue bridge.
- **Scheduling** – Simple sleep/wake schedules with per-day activation, brightness, and color temperature targets.
- **Local friendly security** – Optional single access token for LAN-only deployments without complex auth stacks.
- **SQLite storage** – Lightweight persistence for bridge credentials, schedules, and location data.
- **Polling-based updates** – Reliable HTTP polling instead of websockets for reduced complexity.

## Project structure

```
.
├── index.html                # Vite entry point for the React client
├── public/                   # Static assets (served by Vite)
├── src/
│   ├── client/               # React UI components and pages
│   ├── server/               # Express server, Hue integration, scheduler, storage
│   ├── shared/               # Shared TypeScript types & constants
│   └── config/               # Color presets and defaults
├── package.json              # Combined client/server dependencies & scripts
├── tsconfig.json             # Single TypeScript configuration
└── vite.config.ts            # Vite build setup with API proxy
```

## Requirements

- Node.js 18+
- npm 9+
- Philips Hue bridge and lights on the same network

## Installation

```bash
npm install
```

## Development

Start both the API server and Vite dev server:

```bash
npm run dev
```

- Express API runs on http://localhost:5000
- Vite dev server runs on http://localhost:5173 with `/api` proxying to Express

## Building for production

```bash
npm run build
npm start
```

`npm start` serves the compiled React bundle from `dist/client` and the Express API from `dist/server`.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | API & static site port |
| `ACCESS_TOKEN` | _(unset)_ | Optional token for protecting the API (sent via `X-Access-Token` or `Authorization: Bearer ...`)|
| `HUE_DB_PATH` | `./data/circadian-hue.db` | Path to the SQLite database file |
| `LOCATION_ENDPOINT` | `https://ipapi.co/json/` | Endpoint used for IP-based location detection |

## First-time setup

1. **Pair the Hue bridge**
   - Ensure the server can reach the bridge over the LAN.
   - Open the *Settings → Hue bridge* section and click “Discover bridges”.
   - Press the physical link button on the Hue bridge.
   - Click “Pair” on the discovered IP address.

2. **Set the installation location**
   - Use the auto-detect button (requires outbound internet access) or enter latitude/longitude manually so the scheduler can calculate sunrise/sunset times.

3. **Review schedules**
   - Configure wake and sleep times, days of the week, and brightness/color targets under the *Schedules* tab.

4. **Enjoy lighting control**
   - Use the dashboard to toggle lights, apply scenes, start effects, or monitor circadian status.

## Data storage

All persistent configuration lives in a single SQLite database. Deleting the database file will reset bridge pairing, schedules, and location data.

## Deploying on a Raspberry Pi or NAS

1. Install Node.js 18 (via `nvm`, `asdf`, or distro packages).
2. Clone this repository and run `npm install`.
3. Optionally export `ACCESS_TOKEN` and `HUE_DB_PATH`.
4. Run `npm run build` followed by `npm start` (or wrap `npm start` with a process manager such as `pm2` or `systemd`).

## API overview

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/status` | GET | Aggregate status including lights, groups, schedules, effects, and current phase |
| `/api/lights/:id/state` | POST | Update an individual light (on/off, brightness, CT, hue, saturation) |
| `/api/groups/:id/state` | POST | Apply state changes to a Hue room/zone |
| `/api/lights/apply-scene` | POST | Apply a preset or Hue scene |
| `/api/effects/start` | POST | Start one of the eight dynamic effects |
| `/api/effects/stop` | POST | Return to normal circadian mode |
| `/api/schedule` | GET/PUT | Fetch or replace the schedule list |
| `/api/location` | GET/POST | Retrieve or set system location |
| `/api/location/detect` | POST | Persist location using the configured IP geolocation service |
| `/api/bridge/discover` | GET | Discover Hue bridges on the LAN |
| `/api/bridge/pair` | POST | Pair with the Hue bridge (press link button first) |
| `/api/bridge/clear` | POST | Forget bridge credentials |

All responses are JSON. Requests that mutate data accept JSON payloads and return `ok: true` along with any updated resources.

## License

MIT License – see [LICENSE](LICENSE) for details.
