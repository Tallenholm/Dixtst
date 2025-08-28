# 🌅 Circadian Hue - Smart Lighting System

<div align="center">
  <img src="generated-icon.png" alt="Circadian Hue Logo" width="120" />
  
  **Professional-grade circadian lighting system for Philips Hue**
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
</div>

## ✨ Features

- 🌍 **Automatic Location Detection** - IP-based geolocation for accurate sunrise/sunset times
- 🌅 **Real Astronomical Calculations** - Precise circadian phase transitions
- 💡 **Smart Light Control** - Individual and group management for Philips Hue lights
- 📱 **Cross-Platform** - Web interface + Android mobile app
- 🎨 **8 Lighting Effects** - Breathing, Rainbow, Fireplace, Ocean Waves, and more
- 📊 **Analytics Dashboard** - Track usage patterns and health insights
- 🔄 **Real-time Updates** - WebSocket-powered live status monitoring
- 🌙 **Sleep/Wake Automation** - Customizable schedules with gradual transitions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (NeonDB recommended)
- Philips Hue Bridge on your network

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/circadian-hue.git
   cd circadian-hue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   ```

4. **Run database migrations**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Web: http://localhost:5000
   - Mobile: See [mobile testing guide](TEST_MOBILE_APP.md)

## 📱 Mobile App

The Android app provides full control of your circadian lighting system:

```bash
cd mobile
npx expo start
```

Install Expo Go on your phone and scan the QR code to test.

## 🏗️ Architecture

```
circadian-hue/
├── client/          # React web application
├── server/          # Node.js backend with Express
├── mobile/          # React Native mobile app
├── shared/          # Shared TypeScript types
└── scripts/         # Build and deployment scripts
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, WebSocket, Drizzle ORM
- **Mobile**: React Native, Expo
- **Database**: PostgreSQL (NeonDB)
- **Smart Home**: Philips Hue API

## 🔧 Configuration

### Circadian Schedule

The system automatically calculates lighting phases based on your location:

- **Night**: Warm, dim lighting for sleep
- **Sunrise**: Gradual brightening to wake naturally
- **Day**: Bright, energizing light
- **Evening**: Warm transition to prepare for sleep

### Custom Scenes

Quick access to preset lighting modes:
- **Focus**: Bright, cool light for productivity
- **Relax**: Warm, medium brightness
- **Cozy**: Very warm, dim atmosphere
- **Bright**: Maximum brightness

## 🛠️ Development

### Build for Production

```bash
./scripts/build.sh
```

This script compiles the web client and server. The mobile app is built separately using Expo—see [`mobile/README.md`](mobile/README.md) for instructions.

### API Documentation

Key endpoints:
- `GET /api/system/status` - System health check
- `GET /api/lights` - List all lights
- `POST /api/lights/:id/update` - Control individual lights
- `GET /api/schedule/current-phase` - Current circadian phase
- `WebSocket /ws` - Real-time updates

## 🚀 Deployment

### Deployment

1. Build the web client and server:
   ```bash
   npm run build
   ```
   (Mobile builds are handled separately; see [`mobile/README.md`](mobile/README.md).)
2. Set production environment variables
3. Start the server:
   ```bash
   npm start
   ```

## 🔒 Security

- Input validation with Zod
- SQL injection protection via Drizzle ORM
- XSS protection in React
- Helmet.js security headers
- Rate limiting (recommended for production)

### TLS Certificates

Place your HTTPS certificate and key files in `server/certs/` and reference them via the `TLS_CERT_PATH` and `TLS_KEY_PATH` environment variables. The Express server reads these paths on startup to enable TLS.

## 📊 Performance

- Bundle size optimized with Vite
- API response times < 100ms
- WebSocket latency < 50ms
- Automatic light updates every 5 minutes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Philips Hue for their excellent API
- The React and Node.js communities
- Contributors and testers

---

<div align="center">
  Made with ❤️ for better sleep and productivity
</div>