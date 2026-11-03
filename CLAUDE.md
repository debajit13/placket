# Placket

Mobile and web stylist for Indian men. Expo + Expo Router + NativeWind + React Native
Reusables + Reanimated. Firebase (Auth, Firestore, Storage, Functions). Cloud Run
for cutouts. Monorepo with pnpm workspaces.

## Read first, every session
1. docs/MOBILE-DESIGN.md (design source of truth; never edit unless the ticket says so)
2. the one issue you were given (its ticket file is in docs/tickets/, same content)
3. docs/PRD.md only when the ticket points to a section

## How to work
- One ticket per session. Do not start the next ticket. Do not "also fix" things.
- Before code: restate the ticket's acceptance criteria as a checklist, list the
  files you will touch, then build.
- packages/stylist is pure TypeScript, no react-native imports, and every rule has
  a unit test with a fixture closet. Run `pnpm test` before claiming done.
- No hex colours outside apps/mobile/tailwind.config.ts. No em dashes in strings.
  No emoji. No LinearGradient. No Alert.alert except destructive confirms.
- Styling: NativeWind classes with tokens. Components from components/ui
  (Reusables). Lists: FlashList. Images: expo-image. Animation: Reanimated
  worklets only.
- Every TextInput has keyboardType and autoComplete. Every Pressable has
  accessibilityRole and accessibilityLabel.
- Secrets never in the repo. Gemini key only in functions config.
- Work on a branch named after the ticket (t-07-today-screen), never on main.
- Commit with the ticket id in the message, push the branch with `gh`, and open a
  PR that says "Closes #<issue>". Never push to main, never merge your own PR.

## Done means
- acceptance criteria checklist all ticked, with evidence (test output, a
  screenshot path, or a command run)
- `pnpm lint && pnpm typecheck && pnpm test` clean
- the grep in docs/MOBILE-DESIGN.md "Forbidden" returns nothing
- a short note in docs/tickets/<id>.md under "## Result": what was built, what
  was not, what to verify on a device

## Commands
pnpm i · pnpm dev (expo start) · pnpm test · pnpm lint · pnpm typecheck ·
pnpm functions:serve · pnpm functions:deploy · gh issue view <n> · gh pr create
