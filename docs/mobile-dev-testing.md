# Mobile Dev Testing (PWA on Phone)

## Quick Start

Run two terminals side by side:

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — Cloudflare Tunnel (generates a public HTTPS URL)
npm run dev:tunnel
```

The tunnel prints a URL like `https://random-words.trycloudflare.com`. Open it on your phone.

## Why Cloudflare Tunnel?

- **HTTPS required** — Push notifications, service workers, and PWA install all require HTTPS. `localhost` on your phone won't work.
- **No account needed** — `cloudflared tunnel --url` creates a free temporary tunnel with no signup.
- **No config** — No DNS, no certs, no port forwarding.

## Installing the PWA on Your Phone

1. Open the tunnel URL in Chrome (Android) or Safari (iOS)
2. **Android**: Tap the "Install app" banner or Menu → "Add to Home screen"
3. **iOS**: Share button → "Add to Home Screen"

## Testing Push Notifications

1. Open the app via the tunnel URL
2. Accept the notification permission prompt
3. Send a message in chat — you'll receive a push notification when the response is ready

## Clearing PWA Cache

If icons or the splash screen look stale after updating:

- **Android**: Settings → Apps → find the PWA → Clear Cache, or uninstall and reinstall from the tunnel URL
- **Chrome DevTools** (desktop): Application → Storage → Clear site data

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tunnel URL changes on restart | Normal — it's a temporary tunnel. Reinstall the PWA with the new URL |
| Service worker not updating | Hard refresh or clear site data |
| Push notifications not working | Ensure VAPID env vars are set in `.env.local` |
| `cloudflared` not found | It runs via `npx` — no global install needed |
