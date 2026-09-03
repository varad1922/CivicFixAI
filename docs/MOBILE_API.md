# CivicFix Mobile API Contract

The Flutter mobile application communicates with the existing Express backend over REST and Socket.IO.

## Base URL
- Emulators: `http://10.0.2.2:5000/api`
- Physical Devices: `http://<LAN-IP>:5000/api`

## Authentication Header
All protected endpoints require:
`Authorization: Bearer <JWT_TOKEN>`

## Endpoints

### 1. Authentication
`POST /auth/login`
- **Request**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "id": "...", "name": "...", "role": "citizen", "token": "..." }`

### 2. Issues
`GET /issues/my-issues`
- **Auth**: Citizen
- **Response**: List of Issue models.

`GET /issues/queue`
- **Auth**: Authority
- **Response**: List of Issue models assigned to the authority.

`POST /issues`
- **Request**: FormData or JSON containing title, category, severity, lat/lng, and AI metadata.
- **Response**: Newly created issue.

`PATCH /issues/:id/status`
- **Auth**: Authority
- **Request**: `{ "status": "In Progress" }`
- **Response**: Updated issue.

### 3. Uploads
`POST /upload`
- **Request**: `multipart/form-data` with `image` file.
- **Response**: `{ "url": "..." }`

### 4. AI
`POST /ai/analyze-issue`
- **Request**: `{ "imageUrl": "..." }`
- **Response**: `{ "category": "...", "severity": "...", "suggestedTitle": "..." }`

## Error Handling
- `401 Unauthorized`: Handled by `api_client.dart` to clear session and redirect to Login.
- `403 Forbidden`: Shows a snackbar indicating lack of permission.
- `500 Server Error`: Shows a generic "Something went wrong" message.
