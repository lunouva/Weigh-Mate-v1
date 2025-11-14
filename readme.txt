
WeightMate v3.1 — PWA (Legacy-safe)
===================================

Upload steps (one-click style):
1) Upload ALL files in this folder to your static host root (index.html at the top level).
2) Ensure HTTPS is on. PWA requires HTTPS for the service worker.
3) Open the site once, then use Settings → "Force Refresh" if you ever deploy updates.
4) iPad/iPhone: Share → Add to Home Screen.

Notes for older Safari (iOS 12.5.x):
- All code is ES5. Buttons are wired with addEventListener.
- Date input falls back to manual YYYY-MM-DD if the picker isn’t shown.
- If buttons don’t respond, press Settings → Force Refresh (clears caches), then reload.

Data:
- Stored locally in localStorage key: weightmate_v31_pwa
- Use Reports → Export CSV for backups.
