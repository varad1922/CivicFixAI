# CivicFix Mobile App - High Level Design (HLD)

## Architecture Overview

The Flutter Mobile application acts as a thin client to the existing CivicFix Express backend. It does not duplicate business logic, directly access the database, or securely hold any service role keys.

### System Flow
```
                    ┌─────────────────┐
                    │ Flutter Mobile  │
                    └────────┬────────┘
                             │
                   REST API + Socket.IO
                             │
                    ┌────────▼────────┐
                    │ Express Backend │
                    └──────┬─────┬────┘
                           │     │
                    ┌──────▼─┐ ┌─▼──────┐
                    │Supabase│ │ Gemini │
                    │DB/Auth │ │  AI    │
                    │Storage │ └────────┘
                    └────────┘
```

## Key Components

1. **API Client (`api_client.dart`)**: Uses `dio` to intercept requests, automatically append JWT tokens securely stored in `flutter_secure_storage`, and normalize errors.
2. **State Management (`Provider`)**: Handles UI state.
    - `AuthProvider`: Manages login, token persistence, and role resolution.
3. **Routing**: Uses role-based navigation. 
    - `role == 'citizen'` -> Citizen Dashboard
    - `role == 'authority'` -> Authority Dashboard
4. **Real-time Engine (`socket_service.dart`)**: Connects to the Express `socket.io` server. Listens to `issue:updated` and `issue:map:new`.

## Security Considerations
- The app NEVER connects directly to Supabase with the `service_role` key.
- It NEVER connects directly to Gemini.
- Image uploads are routed through `POST /api/upload` on the backend, which proxies to Supabase Storage.
