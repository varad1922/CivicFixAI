# CivicFix Mobile Setup Guide

## Requirements
- Flutter SDK 3.x
- Android Studio (for emulator and SDK)
- iOS build requires macOS with Xcode

## Configuration

The Flutter app connects to the Express backend, NOT directly to Supabase.
**No `.env` file containing API keys is required for the Flutter app.**

### Base URL Configuration
Inside `lib/core/network/api_client.dart`, the base URL is determined automatically:

1. **Android Emulator**: `http://10.0.2.2:5000/api`
2. **iOS Simulator**: `http://localhost:5000/api`
3. **Physical Device**: You must change the `baseUrl` in `api_client.dart` to your computer's LAN IP address (e.g., `http://192.168.1.10:5000/api`). 
   - *Note: You must also ensure the Express server is listening on `0.0.0.0` (not just `127.0.0.1`) so it can accept external connections on your local network.*

## Building and Running
```bash
cd mobile
flutter pub get
flutter run
```

To build a release APK:
```bash
flutter build apk --debug
```
