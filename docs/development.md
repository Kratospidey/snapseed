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
  - `npm run web:check`

## Web behavior

- Web is intentionally unsupported for full SnapBrain usage in this stabilization pass.
- `npm run start:web` and `npm run web:check` exist to ensure the app bundles and shows a clear fallback shell instead of crashing.
- This pass does not make SQLite or Capture workflows work on web.

## iPhone / Expo Go timeout triage

### Repo or code issues to rule out first

- Run `npm run validate`.
- Use `npm run start:clear` to clear stale Metro state.
- Confirm the local project can reach the Expo CLI without writing cache files into the repo.
- Confirm web export also passes so platform guards are intact.

### Likely local environment issues

- Try `npm run start:tunnel` if the phone and laptop are not reliably visible on the same network.
- Disable VPN or aggressive firewall rules temporarily.
- Confirm Expo Go is up to date.
- If QR launch stalls, try entering the URL manually from Expo Go.
- If one device works and another times out, treat that as a network or device-path issue before changing app code.

## Local artifact handling

- Expo state is redirected through `EXPO_HOME`.
- npm cache is redirected through `NPM_CONFIG_CACHE`.
- Validation output for `web:check` goes to `/tmp/snapbrain-web-export`.
- Repo-local junk such as `.npm/` and coverage output is ignored.
