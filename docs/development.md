# Development

## Start commands

- `npm run start`: normal Expo start with repo-safe Expo and npm cache paths.
- `npm run start:go`: start for Expo Go explicitly.
- `npm run start:tunnel`: start in tunnel mode when local network discovery is unreliable.
- `npm run start:clear`: start with Metro cache cleared.
- `npm run start:web`: open the intentional unsupported web shell.

## Validation

- `npm run validate`: required repo gate.
- `validate` runs:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run test:web-routes`
  - `npm run web:check`
- `npm run doctor`: Expo package and config health check.

## Web behavior

- Web is intentionally unsupported for full SnapBrain usage in this stabilization pass.
- `npm run start:web` and `npm run web:check` exist to ensure the app renders a valid unsupported shell instead of crashing or falling into a broken route tree.
- This pass does not make SQLite or Capture workflows work on web.

## iPhone / Expo Go timeout triage

### Repo or code issues to rule out first

- Run `npm run validate`.
- Run `npm run doctor`.
- Use `npm run start:clear` to clear stale Metro state.
- Watch the Metro terminal for `[startup]` logs:
  - `[startup] SnapBrain root layout mounted`
  - `[startup] SQLite init begin`
  - `[startup] SQLite init complete`
  - `[startup] SQLite init failed`
- If the app shows the startup error screen, treat that as a repo/runtime issue instead of a network issue.
- Confirm the local project can reach the Expo CLI without writing cache files into the repo.
- Confirm `npm run test:web-routes` and `npm run web:check` both pass so web route guards are intact.

### Likely local environment issues

- Try `npm run start:tunnel` if the phone and laptop are not reliably visible on the same network.
- Disable VPN or aggressive firewall rules temporarily.
- Confirm Expo Go is up to date.
- If QR launch stalls, try entering the URL manually from Expo Go.
- If one device works and another times out, treat that as a network or device-path issue before changing app code.

## Capturing startup diagnostics

- Keep the Metro terminal open while launching from Expo Go.
- If the QR scan times out before any `[startup]` log appears, the problem is likely before the app runtime connects and is often LAN, firewall, VPN, or Expo Go related.
- If `[startup] SQLite init begin` appears and is followed by an error, record the exact error from Metro and treat it as a repo-side startup issue.
- If the app reaches the on-screen startup error view, capture the message and the matching Metro log line together.

## Local artifact handling

- Expo state is redirected through `EXPO_HOME`.
- npm cache is redirected through `NPM_CONFIG_CACHE`.
- Validation output for `web:check` goes to `/tmp/snapbrain-web-export`.
- Repo-local junk such as `.npm/` and coverage output is ignored.
