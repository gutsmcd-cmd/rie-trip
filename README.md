# Rie Trip

Offline-first Progressive Web App travel companion for **Rie** — Barcelona → Madrid → Dubai (Oct–Nov 2026).

Truly free: **no ads, no login, no analytics**. Install on a phone (Add to Home Screen) and use hotel details, tips, emergency numbers, and notes without signal. Maps links need connectivity; everything else works offline.

## Features

- **Today / Home** — auto-selects the active stay from the device date; manual chip switcher for Barcelona, Madrid, Dubai
- **Stay detail** — address (tap to copy), call hotel, Google Maps + `geo:` links, check-in/out times, tips
- **Confirmation #** — optional per-stay field stored **only in localStorage on this device** (never shipped in the repo)
- **Safety** — one-tap emergency call for Spain (112) / UAE (999), offline checklist
- **Quick tools** — flashlight (torch API or bright white screen), copy a short “I’m OK” message for Mat, personal notes

Bilingual UI: English primary with short Japanese labels on key actions (泊まる / 電話 / 地図 / 緊急 / ライト / メモ).

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

Hilton confirmation numbers are **not** hardcoded. Enter them in Settings-style fields in the app; they remain on-device only.
