# Testing Your Circadian Hue Mobile App

## Quick Start Testing

### Method 1: Expo Go (Easiest)
1. Install **Expo Go** app from Google Play Store on your Android device
2. Make sure your phone and computer are on the same WiFi network
3. In terminal, run:
   ```bash
   cd mobile
   npx expo start
   ```
4. Scan the QR code with Expo Go app
5. Your app will load on your phone with live reload!

### Method 2: Web Browser (For Basic Testing)
```bash
cd mobile
npx expo start --web
```
Opens in your browser at http://localhost:19006

### Method 3: Android Emulator
1. Install Android Studio
2. Set up Android Virtual Device (AVD) 
3. Run:
   ```bash
   cd mobile
   npx expo start --android
   ```

## Testing Connection to Backend

Your mobile app needs to connect to your Circadian Hue server:

1. **Find your server IP address:**
   - If testing locally: `http://localhost:5000`
   - If testing on same network: `http://YOUR_COMPUTER_IP:5000`
   - Find your IP with: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

2. **Configure in the app:**
   - When you first open the mobile app, you'll see a connection screen
   - Enter your server URL (e.g., `http://192.168.1.100:5000`)
   - Test the connection

## What You Can Test

### ✅ App Features Ready for Testing:
- **Connection Screen**: Server URL configuration and connection testing
- **Dashboard**: Real-time system status and current lighting phase
- **Light Control**: Individual light brightness and color temperature
- **Quick Controls**: Preset lighting scenes (Focus, Relax, Cozy, Bright)
- **System Status**: Engine status, schedule status, last update time
- **Settings**: System controls and configuration

### 🚧 Features Implemented but Need Backend Integration:
- Bridge setup wizard (connects to your Hue API)
- Advanced scheduling (uses your existing schedule API)
- Room grouping (uses your room management API)

## Troubleshooting

**App won't connect to server?**
- Make sure your Circadian Hue server is running (`npm run dev`)
- Check firewall settings
- Ensure devices are on same network
- Try `http://YOUR_IP:5000` instead of `localhost:5000`

**TypeScript errors?**
- The app has some TypeScript warnings that don't affect functionality
- These are mainly missing type definitions for React Native components

**Expo Go not loading?**
- Clear Expo Go cache in the app settings
- Restart the development server
- Check that your devices are on the same WiFi network