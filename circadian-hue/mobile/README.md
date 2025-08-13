# Circadian Hue Mobile App

React Native/Expo application for controlling the Circadian Hue smart lighting system.

## Setup

1. Install dependencies:
```bash
cd mobile
npm install
```

2. (Optional) Configure the server URL:
```bash
export SERVER_URL="http://192.168.1.100:5000"
```

3. Start the development server:
```bash
npm start
```

4. Run on Android:
```bash
npm run android
```

## Features

- **Real-time Dashboard**: Live system status and phase indicators
- **Light Control**: Individual light brightness and color temperature
- **Quick Controls**: Preset scenes for different activities
- **Bridge Setup**: Philips Hue bridge discovery and pairing
- **Settings**: System configuration and connection management

## Architecture

- **React Native + Expo**: Cross-platform mobile development
- **React Navigation**: Native navigation with bottom tabs
- **TanStack Query**: Server state management and API caching
- **React Native Paper**: Material Design components
- **TypeScript**: Full type safety throughout the app

## API Connection

The mobile app connects to your Circadian Hue server running on your local network. Set the base URL via the `SERVER_URL` environment variable before starting the app.

Default development URL: `http://localhost:5000`

