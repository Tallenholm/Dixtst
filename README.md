# Dixtst

This repository has removed platform-specific configuration and now uses a simple Node.js test suite with CI.

## Testing

Run the tests locally with:

```bash
npm test
```

## Mobile App

The React Native client reads the server base URL from the `SERVER_URL` environment variable. Set it before starting the Expo development server:

```bash
cd circadian-hue/mobile
export SERVER_URL="http://localhost:5000"
npm start
```


