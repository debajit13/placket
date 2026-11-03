# T-01 Monorepo scaffold
Phase: 0 · Depends on: none · PRD: docs/PRD.md

## Goal
Monorepo scaffold.

## Acceptance criteria
- [ ] pnpm workspaces
- [ ] `apps/mobile` from `create-expo-app` with Expo Router and TypeScript strict
- [ ] `packages/stylist`, `packages/schema`, `functions`, `services/cutout` folders with package.json each
- [ ] `pnpm lint/typecheck/test` run clean (empty tests)
- [ ] CLAUDE.md and docs/ in place
- [ ] \`npx expo start --web\` renders the index route in a browser

## Notes


## Result
Built:
- pnpm workspaces (`pnpm-workspace.yaml`: apps/*, packages/*, functions, services/*), pnpm pinned
  to 10.34.9 via `packageManager`. pnpm 12 does not run under the corepack bundled with Node 22.
  `.npmrc` uses `node-linker=hoisted` for Metro.
- `apps/mobile` from `create-expo-app@5.0.0 --template default`: Expo SDK 58 (`expo ~58.0.22`,
  `sdkVersion` pinned in `app.json`), Expo Router, React Native 0.88, TypeScript strict. Routes
  live in `apps/mobile/app/` (PRD layout, not the template's `src/app`). Template demo screens,
  components, theme constants and demo assets removed; `index.tsx` is a plain unstyled placeholder.
  `npx expo-doctor`: 20/20 checks passed.
- `packages/stylist`, `packages/schema`: TS, empty `src/index.ts`, ESLint, `tsc --noEmit`, Vitest
  with `--passWithNoTests`. `functions`: same plus `engines.node: "20"` and a NodeNext build config.
  `services/cutout`: package.json and README only.
- Root `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`), root `eslint.config.mjs`
  (typescript-eslint) for packages and functions; `apps/mobile` uses `eslint-config-expo` via
  `expo lint`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` all exit 0. `npx expo start --web` renders the
  index route ("Placket") in a browser, checked with Playwright.

Not built, or changed from the template:
- `app.json`: removed the template's hex `backgroundColor` on the splash and Android adaptive
  icon so no hex lives outside the tailwind config. T-02 should set them from tokens (for example
  via `app.config.ts`). The icons and splash image are still the Expo placeholders.
- `web.output` changed from `server` to `static` to match the PRD's Firebase Hosting static export.
- No `functions:serve` / `functions:deploy` scripts yet; they need firebase-tools (T-04).
- No test runner in `apps/mobile` yet.
- `pnpm` prints an "Unsupported engine" warning for `functions` on Node 22; expected, since
  Firebase needs `engines.node: "20"`.

Verify on a device: `pnpm dev`, open in Expo Go on Android, the index screen shows "Placket"
centred in light and dark.
