# Rie Trip

Offline-first Progressive Web App travel companion for **Rie** — Barcelona → Madrid → Dubai (Oct–Nov 2026).

Truly free: **no ads, no login, no analytics**. Install on a phone (Add to Home Screen) and use hotel details, tips, emergency numbers, and notes without signal. Maps links need connectivity; everything else works offline.

## Features

- **Today / Home** — auto-selects the active stay from the device date; manual chip switcher for Barcelona, Madrid, Dubai
- **App language** — JA / EN toggle (default Japanese). Separate **destination language chips** show languages spoken there (not app UI translation).
- **Stay detail** — address (tap to copy), call hotel, Google Maps + phone `geo:` links, check-in/out times, tips
- **Offline maps setup** — steps to download hotel area in Google Maps + per-stay “Prepare offline map” link
- **Confirmation # & notes** — stored only in localStorage on this device; copy explains they survive reboot and clear only if site data is deleted
- **Safety** — one-tap emergency call for Spain (112) / UAE (999), offline checklist
- **Quick tools** — flashlight, Translate / Currency / WhatsApp links, Dubai Uber & Careem, custom name+URL shortcuts in localStorage

## Scripts

```bash
npm install
npm run dev       # local Vite server
npm run build     # typecheck + production build → dist/
npm run preview   # preview the production build
```

## Deploy

GitHub Pages workflow: `.github/workflows/pages.yml` (npm ci → build → upload `dist` → deploy-pages).

PWA uses relative `base: './'` so it works from a project subpath or Pages root.

## Privacy note

Hilton confirmation numbers are **not** hardcoded. Enter them in the app; they remain on-device only.
