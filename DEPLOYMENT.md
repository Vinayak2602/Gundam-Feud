# Gundam Feud Cloudflare Deployment

## Architecture

Gundam Feud deploys as two Cloudflare Workers:

- Frontend Worker: Next.js app built with OpenNext.
- Realtime Worker: Durable Objects backend for room codes, game state, WebSocket fan-out, and buzzer events.

The realtime Worker uses:

- `RoomDirectory`: reserves and releases 4-letter room codes.
- `RoomObject`: one Durable Object per active room.

Rooms are temporary. When the host quits or all clients leave, the room is scheduled for cleanup after a 5 minute grace period.

## Cloudflare Workers Builds

Use Cloudflare Workers Builds for the frontend Worker so OpenNext runs in
Cloudflare's Linux build environment.

Cloudflare account:

- `gvinayak1111@gmail.com`

GitHub repository:

- `https://github.com/Vinayak2602/Gundam-Feud`

Frontend Worker:

- Worker name: `gundam-feud`
- Branch: `master`
- Root directory: `/`
- Build command: leave empty
- Deploy command: `npm run cf:deploy`
- Production route/custom domain: `gunfeud.scurfer.dev`

Realtime Worker:

- Worker name: `gundam-feud-realtime`
- Wrangler config: `wrangler.realtime.toml`
- Production route: `gunfeud.scurfer.dev/api/ws*`
- Deploy command, if connecting this Worker to Git later:
  `npx wrangler deploy --config wrangler.realtime.toml`

The realtime Worker was initially deployed with Wrangler. The frontend should be
deployed through Cloudflare Workers Builds from GitHub.

## Environment

Set `NEXT_PUBLIC_WS_URL` for the frontend if the realtime Worker is deployed on a different host from the frontend.

For the current `gunfeud.scurfer.dev` same-origin setup, leave `NEXT_PUBLIC_WS_URL`
unset. The app will connect to `/api/ws`.

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

OpenNext Cloudflare build reached the bundle phase locally on Windows but failed
with a symlink `EPERM` error. Cloudflare/OpenNext also printed a Windows
compatibility warning. This is why the frontend deployment should use
Cloudflare Workers Builds or another Linux CI environment.
