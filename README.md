# AquaGuard mobile app

This is the Expo and React Native app for AquaGuard. The app code is JavaScript. Supabase provides staff sign-in, guest and wristband records, realtime updates, and the wristband telemetry endpoint.

## Run the app

Open a terminal in this folder and run:

```powershell
npm install
npx expo start
```

Open the QR code with Expo Go, or press `a` to launch an Android emulator.

## Supabase setup

Create a local `.env` file using `.env.example` as a guide. Add the Supabase project URL and publishable key. Never put a `service_role` key in the mobile app.

Run `supabase/schema.sql` in the Supabase SQL Editor if the database has not been set up yet. The Edge Function for wristband telemetry is in `supabase/functions/device-ingest/`.

## Project folders

```text
App.js                         App startup, session, and staff profile
src/
  components/                  Reusable app UI
    Brand.js                   AquaGuard name and optional logo
    ThemeSettingsButton.js     Light and dark appearance settings
    shared_ui.js               Shared cards, buttons, forms, and labels
  screens/                     App pages
    login.js                   Staff sign-in
    dashboard.js               Role-based tabs and shared app data
    overview.js                Receptionist home
    guests.js                  Guest list and registration
    wristbands.js              Wristband list and assignment
    geofence_map.js            Resort boundary and wristband locations
    alerts.js                  Lifeguard safety alerts
  lib/
    supabase.js                Supabase client and session storage
  theme.js                     Light and dark colors
supabase/
  schema.sql                   Database tables and access rules
  functions/device-ingest/     Wristband telemetry endpoint
```

Start with `App.js` to understand app startup. Open a file under `src/screens/` to edit a screen, or `src/components/` for reusable UI.
