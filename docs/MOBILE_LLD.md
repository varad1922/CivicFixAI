# CivicFix Mobile - Low Level Design (LLD)

## Directory Structure
```
mobile/
├── lib/
│   ├── core/
│   │   ├── network/          # ApiClient (Dio configuration)
│   │   ├── realtime/         # SocketService
│   │   └── theme/            # Shared styles & colors
│   ├── features/
│   │   ├── auth/             # AuthProvider, LoginScreen, Models
│   │   ├── citizen/          # CitizenDashboard, ReportIssue Flow
│   │   ├── authority/        # AuthorityDashboard, Queue
│   │   ├── map/              # MapScreen, custom markers
│   │   └── profile/          # Profile screen
│   └── main.dart             # Entry point & Routing
```

## State Management
We use the standard **Provider** package (`provider: ^6.1.5`).
- `AuthProvider`: Extends `ChangeNotifier`. Exposes `login()`, `logout()`, `restoreSession()`.
- Provides global access to the current authenticated `User`.

## Network Layer
`ApiClient` is a Singleton that manages a `Dio` instance.
- **Interceptors**: 
  - `onRequest`: Reads `jwt_token` from `FlutterSecureStorage` and injects `Authorization: Bearer <token>`.
- Does NOT store passwords in memory.

## Real-Time Subsystem
`SocketService` uses `socket_io_client`.
- Initializes connection on successful login.
- Subscribes to `issue:updated`.
- Dispatches UI rebuilds when the payload matches an actively viewed issue or map marker.
