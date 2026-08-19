# Gundam Feud Cloudflare Deployment

## Architecture

Gundam Feud deploys as two Cloudflare Workers:

- Frontend Worker: Next.js app built with OpenNext.
- Realtime Worker: Durable Objects backend for room codes, game state, WebSocket fan-out, and buzzer events.

The realtime Worker uses:

- `RoomDirectory`: reserves and releases 4-letter room codes.
- `RoomObject`: one Durable Object per active room.

Rooms are temporary. When the host quits or all clients leave, the room is scheduled for cleanup after a 5 minute grace period.

## Local Commands

Install dependencies:

```sh
npm ci
```

Run the Next.js app locally:

```sh
npm run dev
```

Run the realtime Worker locally:

```sh
npm run realtime:dev
```

Deploy the realtime Worker:

```sh
npm run realtime:deploy
```

Build/deploy the frontend Worker:

```sh
npm run cf:deploy
```

## Environment

Set `NEXT_PUBLIC_WS_URL` for the frontend if the realtime Worker is deployed on a different host from the frontend.

Example:

```sh
NEXT_PUBLIC_WS_URL="wss://gundam-feud-realtime.<account>.workers.dev"
```

Leave `NEXT_PUBLIC_ENABLE_CUSTOM_ASSETS=false` for v1. Logo and title-music uploads are intentionally disabled until custom asset storage is designed.

## Verified Locally

These checks passed on Windows:

```sh
npm run build
npx tsc -p tsconfig.worker.json
npx wrangler deploy --config wrangler.realtime.toml --dry-run
```

OpenNext Cloudflare build reached the bundle phase but failed on Windows with a symlink `EPERM` error. Cloudflare/OpenNext also printed a Windows compatibility warning. Use WSL or an environment with symlink support for the frontend Worker packaging step.
