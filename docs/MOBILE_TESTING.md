# CivicFix Mobile End-to-End Testing Workflows

## Workflow 1: Citizen Reporting
1. Launch app on Android Emulator.
2. Login with a valid Citizen account.
3. Tap "Report Issue".
4. Upload an image (simulated via gallery).
5. Ensure location gets attached.
6. Verify the AI analysis successfully populates Category and Severity from the backend.
7. Submit the report.
8. Verify the issue appears in "My Reports".

## Workflow 2: Authority Resolution & Real-Time Sync
1. Open the Flutter app logged in as a Citizen.
2. Simultaneously, open the web app logged in as the assigned Authority.
3. On the web app, change the status of the newly created issue to "In Progress".
4. Verify the Flutter app's "My Reports" UI updates to "In Progress" INSTANTLY without pulling to refresh (via Socket.IO).
5. Open the Interactive Issue Map in the Flutter app.
6. On the web app, change the status to "Resolved".
7. Verify the map marker on the Flutter app changes to green ("Resolved") instantly.

## Build and Code Analysis
To ensure codebase health before committing:
```bash
flutter analyze
flutter build apk --debug
```
