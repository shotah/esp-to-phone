# AI Companion Mobile App

React Native application for communicating with ESP32 devices via Bluetooth Low Energy (BLE) with MTU negotiation.

## Quick Setup (Windows with PowerShell)

### Prerequisites

- Node.js 18+ installed
- Android Studio with SDK
- Java JDK 11+
- React Native CLI
- PowerShell 7.5.2+ (for optimal terminal integration)

### Installation Steps

**Use the included Makefile for automated setup:**

```bash
# Complete environment setup
make setup-env

# Or step by step:
make install           # Install dependencies
make setup-android-sdk # Configure Android SDK
```

### Building and Running

```bash
# Build and run on connected device
make android

# Or build APK only
make android-debug     # Debug APK
make android-release   # Release APK

# Start development server
make start

# View available commands
make help
```

## Bluetooth Low Energy (BLE) Implementation

This app uses **react-native-ble-plx** for modern Bluetooth Low Energy communication.

### Recommended BLE Library

**Library:** `react-native-ble-plx`

- **NPM:** https://www.npmjs.com/package/react-native-ble-plx
- **GitHub:** https://github.com/dotintent/react-native-ble-plx
- **Example:** https://github.com/PolideaPlayground/SensorTag

### BLE Library Features

✅ **Supported:**

- Observing device's Bluetooth adapter state
- Scanning BLE devices
- Making connections to peripherals
- Discovering services/characteristics
- Reading/writing characteristics
- Observing characteristic notifications/indications
- Reading RSSI
- Negotiating MTU
- Background mode on iOS
- Turning the device's Bluetooth adapter on

❌ **Not Supported:**

- Bluetooth classic devices
- Communicating between phones using BLE (Peripheral support)
- Bonding peripherals
- Beacons

### BLE Setup Instructions

1. **Install the modern BLE library:**

   ```bash
   npm install react-native-ble-plx
   ```

2. **Android Configuration:**

   - Minimum SDK version: 23
   - Add to `android/build.gradle`:
     ```gradle
     allprojects {
         repositories {
             maven { url 'https://www.jitpack.io' }
         }
     }
     ```

3. **Android Permissions (AndroidManifest.xml):**
   ```xml
   <!-- Android >= 12 -->
   <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
   <!-- Android < 12 -->
   <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
   <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
   <!-- Location (required for BLE scanning) -->
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <!-- BLE hardware requirement -->
   <uses-feature android:name="android.hardware.bluetooth_le" android:required="true"/>
   ```

### ESP32 Connection

1. **Power on ESP32** (automatically advertises as "AI-Companion")
2. **In the app:**
   - Tap "Connect (Just Works)"
   - App automatically scans and connects
   - MTU negotiation establishes optimal packet size
   - Real-time communication begins

### Communication Protocol

The app communicates via BLE with MTU negotiation using JSON messages:

```json
// ESP32 → App
{
  "type": "btn",
  "message": "Ask AI",
  "action": "ask"
}

// App → ESP32
{
  "type": "test",
  "message": "Hello from React Native app!",
  "action": "test_message"
}
```

## Legacy Dependencies Removed

⚠️ **Removed outdated libraries:**

- `react-native-bluetooth-serial` (deprecated, build issues)
- `react-native-camera` (variant conflicts)
- `react-native-qrcode-scanner` (depends on camera)

## Makefile Commands

The project includes a comprehensive Windows-compatible Makefile:

```bash
# Installation & Setup
make install              # Install dependencies
make setup-env           # Complete environment setup
make check-deps          # Check system dependencies

# Development
make start               # Start Metro bundler
make android             # Build and run on device
make android-debug       # Build debug APK
make devices-android     # List connected devices

# Testing & Quality
make test                # Run tests
make lint                # Run ESLint
make format              # Format code

# Utilities
make clean               # Clean node_modules and caches
make clean-all           # Deep clean including Android
make doctor              # Run React Native doctor
```

## Troubleshooting

### Build Issues

```bash
make clean-all           # Deep clean
make setup-env           # Reconfigure environment
make android-debug       # Try building again
```

### BLE Connection Issues

- Ensure device Bluetooth is enabled
- Check ESP32 is advertising BLE services
- Verify location permissions are granted
- Check Android 12+ permission requirements

### Development

```bash
make android-logs        # View device logs
make debug-info          # Show system information
```

## Getting Started (Original React Native Guide)

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native:

```sh
# Using Makefile (recommended)
make start

# OR using npm
npm start
```

### Build and run your app

```sh
# Using Makefile (recommended)
make android

# OR using npm
npm run android
```

If everything is set up correctly, you should see your new app running in the Android Emulator or your connected device.

## References

- **BLE Library:** [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
- **BLE Example:** [SensorTag Example](https://github.com/PolideaPlayground/SensorTag)
- **React Native:** [Official Documentation](https://reactnative.dev)
- **Android BLE:** [Developer Guide](https://developer.android.com/guide/topics/connectivity/bluetooth-le)

## Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
