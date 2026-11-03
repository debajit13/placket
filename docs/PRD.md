# Placket PRD and Build Plan

Nov 3, 2026 · @Debajit

## Product definition

Placket is a mobile and web stylist for Indian men who do not care about fashion but want to look put-together, using only the clothes they already own, and it explains why each outfit works.

**The problem.** A man with 20 pieces in his closet has hundreds of possible combinations and no way to tell which ones work. He copies Pinterest and guesses. Existing closet apps (Whering, Acloset, Indyx, Google Photos Wardrobe) digitize the closet and shuffle outfits; none of them teach the rules, and none are built for Indian menswear.

**The wedge.** Explainability. Every suggestion comes with the rule it followed, in one sentence a person can reuse without the app. That is the thing Pinterest cannot do and the thing the user (Debajit, first) actually needs.

**Who v1 is for.** One persona: a working man in India, 22 to 40, Android first, who dresses for office, off-duty, and the occasional wedding or puja. Built for the founder first, then 20 testers from GDG Siliguri.

**What v1 is.**

- A closet of the user's own pieces, added by photo (auto background removal, auto tags the user can correct).
- Three outfits for today, for a chosen occasion, drawn from that closet, each with a one-line reason.
- A why-this-works screen that names the rules used.
- Wore it / not for me feedback that improves later picks.
- One gap suggestion: the single purchase that unlocks the most new outfits, with a Myntra link.

**What v1 is not.** No virtual try-on, no body measurement from photos, no womenswear, no social feed, no calendar or weather integration beyond a manual occasion pick, no payments. These are listed in Out of scope with the reason each one waits.

**Success for the prototype.** Ten testers add at least five pieces, open the app on three separate days, and tap Wear this today at least once. If fewer than half get past five pieces, onboarding is the problem and gets fixed before anything else.

Name: Placket, the buttoned strip down the front of a shirt or kurta. A tailor's word, unbranded anywhere, and it fits the lookbook register. The app does not use a stylist persona or mascot; the voice is the app's own, plain and specific.

## User flows and screens

The app has three tabs (Today, Closet, You), one push screen (Look detail), and one modal flow (Add a piece). The approved mockups are on the canvas [Placket Mobile Flow Prototype](https://claude.ai/artifact/8nx6eMQ4KLkZ3sYLK2xvj6); every screen below maps to one artboard there.

**First run (once).**

1. Sign in with Google (Firebase Auth). No email/password in v1.
2. Profile, one screen: height in cm, build (Slim / Average / Broad / Heavier), natural contrast (High / Medium / Low, shown as skin and hair swatches), occasions dressed for most weeks (multi-select). Artboard: Onboarding.
3. Add five pieces. Camera or gallery, background removed on-device or server-side, tags shown as a list the user taps to mark wrong. Progress strip shows five slots. Artboard: AddItem. The user can leave after any number of pieces; Today works with as few as three (one top, one bottom, one pair of shoes) and says what is missing otherwise.
4. Land on Today.

**Daily loop (every open).**

1. Today shows three looks for the selected occasion (Office by default, remembered per weekday). Each look: a flat-lay of the cutouts, a title, a one-line reason, a chevron. Artboard: Main.
2. Tap a look: Look detail shows the full flat-lay, the pieces, three or four rule cards (the why), an optional step-up swap, Wear this today, and three not-for-me reasons. Artboard: Detail.
3. Wear this today logs a wear for every piece, returns to Today with that look marked worn, and the other two dimmed.
4. Show me different ones regenerates from the rules engine (free) and only calls the LLM for new reasons if the daily budget allows.

**Closet and gap.**

1. Closet lists pieces by slot (Tops, Bottoms, Shoes, Layers, Accessories) with wear counts, and one gap card at the top. Artboard: Closet.
2. Tap a piece: edit tags, mark as away (laundry, lent), archive.
3. The gap card names one purchase, the number of looks it unlocks, and a Myntra search link. Not now hides it for 14 days.

**You.** Profile fields from first run, light/dark, daily usage shown plainly ("2 of 3 fresh sets left today"), sign out, delete account and data.

| Screen | Route (Expo Router) | Container |
| --- | --- | --- |
| Sign in | `app/(auth)/sign-in.tsx` | auth group |
| Profile | `app/(auth)/profile.tsx` | auth group, also reachable from You |
| Today | `app/(tabs)/index.tsx` | tab root |
| Look detail | `app/look/[id].tsx` | push |
| Closet | `app/(tabs)/closet.tsx` | tab root |
| Piece detail | `app/piece/[id].tsx` | push |
| Add a piece | `app/add-piece.tsx` | modal (pageSheet) |
| You | `app/(tabs)/you.tsx` | tab root |

Android back pops everywhere; Add a piece confirms discard only if a photo was taken. Max taps to any core screen: 2.

## The stylist rules engine

The rules engine is pure TypeScript in `packages/stylist`, runs on-device, has no network dependency, and is the only thing that decides which outfits are candidates. The LLM never invents an outfit; it ranks and explains what the engine produced. Every rule returns a score in \[0, 1\] plus a short reason string, so the explanation screen is built from the same objects that scored the outfit.

**Piece model.** Every piece carries: `slot` (top, bottom, shoes, layer, accessory), `subtype` (tee, shirt, kurta, chinos, jeans, trousers, sneakers, loafers, kolhapuri, nehru-jacket, …), `colorHex` (dominant, from k-means on the cutout), `colorRole` (neutral or accent, derived from hex: low chroma or navy/olive/denim/khaki/black/white/grey count as neutral), `pattern` (plain, stripe, check, print), `patternScale` (fine, medium, bold), `formality` (1 to 5), `weight` (slim, regular, chunky; for bottoms and shoes), `fabric` (cotton, linen, denim, wool, synthetic), `season` (hot, mild, cold, all), `occasions` (array), `wears`, `lastWorn`, `away`.

**Hard constraints (candidate generation).** An outfit is one top, one bottom, one pair of shoes, optionally one layer, optionally one accessory. Reject if any of these fail:

- Every piece is available (not away, not archived).
- Formality spread: `max(formality) - min(formality) <= 1`.
- Occasion: every piece lists the chosen occasion, or is neutral-occasion.
- Season matches today's season band (hot: Mar to Oct in the plains; mild: Nov to Feb). A manual override exists in You.
- Not worn in the last 2 days (any piece), unless the closet is too small to avoid it.
- At most one patterned piece unless both patterns differ in scale by two steps (fine with bold).

**Soft scores (ranking).** Weighted sum; weights are constants in `packages/stylist/weights.ts` and are the first thing to tune from feedback.

```typescript
type Rule = (o: Outfit, p: Profile) => { score: number; reason?: string };

formalityCoherence: 1 - spread/2                      // weight 0.20
colorHarmony:                                         // weight 0.25
  neutrals only                      -> 0.9, "all neutrals, cannot clash"
  one accent + neutrals              -> 1.0, "one accent, rest neutral"
  two accents, complementary/analog  -> 0.6
  two accents, clashing              -> 0.1
contrastFit:                                          // weight 0.15
  profile.contrast high  & outfit has dark top/light bottom or reverse -> 1.0
  profile.contrast low   & outfit tonal (all within 25 lightness)     -> 1.0
  otherwise 0.5
proportion: shoes.weight == bottom.weight ? 1 : 0.4   // weight 0.15
repeatColor: a hue appears twice (shoe+belt, top+watch strap) ? 1 : 0.6 // 0.05
freshness: days since last wear of least-fresh piece, capped at 14, /14 // 0.10
feedback: learned per-pair affinity from wore/not-for-me, default 0.5   // 0.10
```

**Contrast rule, spelled out.** High contrast (dark hair against lighter skin) carries a dark top over light bottoms or the reverse. Low contrast looks better tonal. Medium gets no bonus either way. This is the one rule that uses the profile, and it is why onboarding asks for it.

**Proportion rule.** Slim bottoms want slim shoes (loafers, low sneakers, kolhapuris); regular or wide bottoms want regular or chunky shoes. Shirt length and tuck are v2.

**Indian layer.** `kurta` is a top with formality 3 (plain) or 4 (festive); pairs with jeans, chinos, or pyjama. `nehru-jacket` is a layer that adds +1 formality to any outfit it joins. `kolhapuri` is a slim shoe, hot-season, formality 2 to 3. `wedding` and `puja` occasions require formality >= 4 and favour kurta or shirt over tee. Fabric rule for hot season: linen and cotton score 1.0, synthetic 0.5, wool rejected.

**Step-up swap.** After ranking, for the top look, search for one single-piece swap that raises min formality by exactly 1 while keeping all hard constraints. If found, it becomes the fourth rule card ("If the day turns formal").

**Gap finder.** For each catalogue archetype (mid-grey trousers, white shirt, navy chinos, brown loafers, plain kurta, …) simulate adding it to the closet and count new valid outfits. The archetype with the highest delta is the gap, shown only if delta >= 5.

**Explanations.** The top three rule reasons by weighted contribution become the rule cards; the LLM rewrites them in plain language for the user but may not add a rule the engine did not fire. Unit tests assert that for a fixed closet fixture the engine returns a deterministic ranked list.

## Recommendation pipeline

The pipeline is six stages; only two of them cost money (tagging and explaining), and both are cached and capped.

1. **Capture.** `expo-camera` or `expo-image-picker`. Image resized to max 1024 px on the long side before upload (`expo-image-manipulator`). Permission requested at the moment the user taps Add a piece, never on launch.
2. **Cutout.** Upload to Cloud Storage; a Cloud Run service runs `rembg` with the BiRefNet-general model and writes a PNG with alpha back. Fallback if the service fails: keep the original photo, flag `cutout: false`, and still allow tagging. The cutout shows with the corner marks and the "Background removed" caption from the mockup.
3. **Tagging.** A Cloud Function sends the cutout to Gemini Flash with a strict JSON schema (`subtype`, `pattern`, `patternScale`, `formality`, `fabric`, `season`, `occasions`, `weight`). Colour is NOT taken from the model: `colorHex` comes from k-means (k=3) over the alpha-masked pixels, computed in the same function. The user sees the tags as a list and taps any that are wrong; corrections are stored and used as few-shot examples for that user's later tags.
4. **Candidates.** On-device, `packages/stylist` generates every valid outfit for the chosen occasion and scores it. For a 30-piece closet this is a few thousand combinations and takes well under 100 ms. Top 12 by score go forward.
5. **Rank and explain.** The top 12 outfits, as tagged JSON (no images), plus the profile and occasion, go to Gemini Flash in one call. It returns the three it would show, in order, with a title (two to four words, in the style of the mockup: "Navy anchor") and one reason sentence per rule card. The prompt forbids inventing rules; a validator checks every returned rule id exists in the engine's output for that outfit, and drops the LLM's text for any that does not. If the call fails or the budget is spent, the top 3 by engine score ship with the engine's own reason strings. The app never blocks on the LLM.
6. **Feedback.** Wear this today writes a `wear` event per piece and a `look_worn` event. Not for me writes `look_rejected` with the reason. A small affinity table per user (`pairAffinity[pieceA][pieceB]`, start 0.5, +0.1 on worn, -0.15 on rejected, clamped) feeds the `feedback` rule next time. No model training in v1.

**Caching.** The explain call is keyed by `hash(sortedPieceIds, occasion, profileVersion, date)` and stored in Firestore under the user. Reopening Today on the same day with the same closet is free. Changing occasion is a new key. Adding a piece invalidates that day's keys.

**Latency budget.** Capture to cutout shown: under 6 s on a mid-range Android on 4G. Today screen with cache: under 300 ms. Today screen cold with LLM: under 4 s, with the engine's top 3 shown immediately and titles/reasons swapped in when the LLM returns.

**What is deliberately not in the pipeline.** No image embeddings (FashionCLIP) in v1; the tagged schema plus rules is enough for a 30-piece closet and keeps everything on-device. Add Marqo-FashionCLIP only if "find pieces like this" becomes a requested feature.

## Architecture and data model

One Expo codebase that ships as Android, iOS and web, one Firebase project, one small Cloud Run container. Nothing else.

**App.** Expo SDK (latest stable at project start; Claude Code checks `npx expo --version` and pins it in `app.json`), TypeScript strict, Expo Router (file-based routes from the flows table), NativeWind for styling with every token in `tailwind.config.ts` (zero hex values in screen files), React Native Reusables for owned primitives (Button, Chip, Input, Sheet), Reanimated and Gesture Handler for motion, `expo-image` with blurhash placeholders, FlashList for the closet grid, `react-native-safe-area-context` for insets, Lucide for the handful of icons (chevron, back, plus, camera; the tab bar is text). State: Zustand for UI and session, TanStack Query for Firestore reads with offline cache. Fonts: Bodoni Moda and Archivo via `@expo-google-fonts`, loaded before splash hide. Web: Expo web (react-native-web) with Metro bundling, deployed to Firebase Hosting as a static export; the same routes serve as URLs (\`/closet\`, \`/look/abc\`); on web the camera step becomes a file picker with drag-and-drop, content is capped at 720 px wide and centred, hover is enhancement only, and FlashList falls back to FlatList where web support is missing. Nothing may require a native-only module without a web fallback.

**Backend.** Firebase Auth (Google provider), Firestore, Cloud Storage, Cloud Functions (Node 20, TypeScript) for tagging, explaining, usage caps, and gap computation; Cloud Run (Python, `rembg` + BiRefNet, min instances 0, 2 GB memory, CPU only) for cutouts. Secrets (Gemini API key) in Functions config, never in the app. Region `asia-south1` (Mumbai).

**Monorepo.**

```
placket/
  apps/mobile/            Expo app (app/, components/, lib/, theme/)
  packages/stylist/       rules engine, pure TS, no RN imports, 100% unit tested
  packages/schema/        zod schemas shared by app and functions
  functions/              Cloud Functions (tag, explain, gap, usage)
  services/cutout/        Cloud Run Dockerfile + FastAPI + rembg
  docs/                   PRD.md, MOBILE-DESIGN.md, tickets/
  CLAUDE.md
```

**Firestore.**

| Collection | Document | Fields |
| --- | --- | --- |
| `users/{uid}` | profile | `heightCm`, `build`, `contrast`, `occasions[]`, `theme`, `profileVersion`, `createdAt`, `tester: boolean` |
| `users/{uid}/pieces/{pieceId}` | one piece | all Piece model fields, `photoPath`, `cutoutPath`, `cutout: boolean`, `tagsCorrected: boolean`, `archived`, `away`, `wears`, `lastWorn` |
| `users/{uid}/looks/{lookId}` | a generated look | `pieceIds[]`, `occasion`, `date`, `engineScore`, `ruleReasons[]`, `title`, `llmReasons[]`, `source: engine or llm` |
| `users/{uid}/events/{eventId}` | feedback | `type: wear, look_worn, look_rejected, gap_dismissed`, `pieceIds[]`, `lookId`, `reason`, `at` |
| `users/{uid}/affinity/{pairKey}` | learned pair | `score` (0 to 1) |
| `users/{uid}/usage/{yyyy-mm-dd}` | daily counters | `tags`, `explains`, `cutouts` |
| `users/{uid}/cache/{key}` | explain cache | `looks[]`, `expiresAt` |
| `testers/{email}` | allowlist | `addedAt`, `note` |

Security rules: a user reads and writes only `users/{uid}/**`; `usage`, `cache`, and `affinity` are written only by Functions; `testers` is read-only to clients and written by the owner from the console.

**Storage.** `users/{uid}/pieces/{pieceId}/original.jpg` and `cutout.png`. Rules mirror Firestore. Originals are deleted 30 days after a successful cutout to keep the bucket small.

**Cloud Functions (callable, all check `tester` and usage caps first).**

- `tagPiece({pieceId})` → runs cutout request, k-means colour, Gemini tagging; writes the piece; increments `usage.tags`.
- `explainLooks({occasion, candidates[]})` → cache check, Gemini rank+explain, validator, writes `looks`, increments `usage.explains`.
- `computeGap()` → runs on piece add or archive; writes `users/{uid}.gap`.
- `onWear` Firestore trigger → updates `wears`, `lastWorn`, affinity.

**Environments.** `dev` (your Firebase project, Expo Go / dev build on your phone) and `prod` (a second Firebase project, EAS build, Play internal testing). Same code, different `google-services.json` via EAS environment variables. iOS build waits until there is an Apple account; nothing in the code is Android-only.

## Cost controls

The prototype should cost under ₹500 a month with 20 testers. Three mechanisms, all server-side, all in `functions/usage.ts`.

| Control | Rule | Where enforced |
| --- | --- | --- |
| Tester allowlist | Any Google account can sign in; `tagPiece`, `explainLooks` and the cutout endpoint run only if `testers/{email}` exists. Others see the app with a note: "Placket is in private testing." | every callable, first line |
| Daily caps | per user per day: 10 tags, 3 explains, 10 cutouts. Regenerating from the engine is free and unlimited. The You tab shows the counters plainly. | `usage/{date}` transaction before each paid call |
| Cache | explain results keyed by closet + occasion + date; reused all day | `cache/{key}` |

**Unit costs (Nov 2026, approximate).** Gemini Flash tagging with one image: about ₹0.05 per piece. Explain call on tagged JSON for 12 candidates: about ₹0.3. Cloud Run cutout: about ₹0.4 per image at 15 s CPU, less if BiRefNet is warm. Firestore and Storage at this scale are inside the free tier.

**Worst case.** 20 testers all hitting every cap every day for 30 days: 6,000 tags (₹300) + 1,800 explains (₹540) + 6,000 cutouts (₹2,400) = about ₹3,200. Real usage will be a tenth of that because closets stop growing after week one. Alerting: a Cloud Billing budget at ₹1,000 with email at 50% and 90%.

**Kill switch.** A Remote Config flag `aiEnabled`. Off: the app keeps working on the engine alone, tags default to "unknown" for the user to fill by hand, and the Today reasons come from the engine strings. This is also the offline path, so it gets tested from day one.

**What is not rate-limited.** Sign-in, reading the closet, the rules engine, wear logging, theme switching. Nothing the user does ten times a day costs anything.

## MOBILE-DESIGN.md

This section is copied verbatim into `docs/MOBILE-DESIGN.md` at the repo root and is the design source of truth. Claude Code reads it before any UI work and never changes it without being told. The approved artboards are at [Placket Mobile Flow Prototype](https://claude.ai/artifact/8nx6eMQ4KLkZ3sYLK2xvj6).

```markdown
# MOBILE-DESIGN.md

APP READ: fashion utility for Indian men who do not care about fashion,
editorial language (a tailor's lookbook), premium but plain.
platforms: Android first-class, web first-class (Expo web, max content width 720), iOS first-class when an account exists.
posture: unified-brand.

DIALS: DESIGN_EXPRESSION 8 · MOTION_INTENSITY 5 · VISUAL_DENSITY 2

## Tokens (tailwind.config.ts; no hex outside this file)

| token        | light     | dark      | use |
| ground       | #EDEBE6   | #12151F   | screen background ("paper" / "ink") |
| plate        | #F6F4EF   | #1B2030   | surfaces that hold a garment image |
| plateEdge    | #DAD7D0   | #2E3444   | 1px border on plates |
| ink          | #15192B   | #EDEBE6   | primary text, primary button fill |
| text2        | #3F4455   | #C3C6CF   | body text |
| muted        | #6B7080   | #8B91A1   | captions, inactive tabs |
| hair         | #CFCCC4   | #2E3444   | hairline dividers |
| rule         | = ink     | = ink     | the one heavier rule that opens a section |
| pill         | #A9A79F   | #4A5163   | unselected chip border |
| accent       | #B5342B   | #E07A64   | ONE use per screen, never two |
| garmentEdge  | none      | #3A4458   | faint edge on dark garments in dark mode only |

Dark mode: inverted, not redesigned. Same type, same layout, same spacing.

## Type (@expo-google-fonts)

- Display: Bodoni Moda, opsz 96, weight 400 upright / 500 italic.
  Screen titles 54/0.96, section titles 42/0.98, look titles 30 italic/1.0,
  rule-card titles 20/1.1, captions 15 italic. Tab labels 19, active = italic.
- Functional: Archivo 400/500/600. Body 14/1.45, chips 14/500, buttons 15/500
  with 0.01em tracking, meta 13.
- No other families. No ALL CAPS. No eyebrow labels. No single-word accent
  inside a headline.

## Shape (by role, never mixed)

- 999 (pill): selection chips, secondary pills, "Add a piece"
- 12: primary button (56 high, 20 side padding), contrast tiles, flat-lay areas, camera plate
- 10: closet thumbnails, text inputs (44 high)
- 0: nothing. Hairlines are 1px, never rounded containers.

## Spacing

- Screen gutter 20. Section gap 24. Row padding 16/0. Chip gap 8. Grid gap 10.
- Every touchable >= 44pt. Small glyphs get hitSlop.
- Content top-aligned. Primary action in the bottom third.
- Bottom scroll padding = insets.bottom + 24.

## Structure rules

- No cards. Group with hairlines and one heavier rule where a section opens.
  The only bordered boxes are plates that hold a garment image.
- Garments are the brightest thing on screen. Flat-lays overlap and tilt
  (top -8deg left, bottom +6deg right, shoe -14deg crossing both).
- Three text tabs, Bodoni, no icons, active in italic. No FAB.
- One accent use per screen: the active occasion underline, a "Background
  removed" caption, a Myntra link, a +1. Pick one.
- Icons: Lucide, 24, stroke 1.5, only chevron-left, chevron-right, plus, camera, x.
- Theme toggle lives in You, not in headers (the header toggle in the
  mockups is a prototype aid).

## Motion (Reanimated)

- Press: spring scale 0.97 on every touchable.
- Look change on Today: 180ms crossfade of the flat-lay, titles swap
  without motion.
- Wear this today: the chosen look settles (scale 1 -> 0.98 -> 1 spring),
  others fade to 60%.
- Tags list on Add: items enter staggered 40ms, first mount only, max 6.
- Nothing else moves on its own. useReducedMotion collapses all to instant.

## Copy

- Sentence case. Plain verbs. No exclamation marks. No em dashes (use commas
  or full stops). No emoji. No "Welcome back".
- Buttons say what happens: "Wear this today", "Looks right, next piece",
  "Show me different ones", "Not now".
- Look titles are two to four words, concrete: "Navy anchor", "Kurta, kept plain".
- Empty closet: "Three pieces are enough to start: a top, a bottom, shoes."
- Errors say what to do: "Couldn't read the photo. Try more light, or lay it flatter."

## Forbidden (grep before every PR)

#6366F1 #7C3AED #8B5CF6 · LinearGradient · emoji in JSX · "—" · inline hex in
screens · paddingTop: 50 · Alert.alert for anything but destructive confirms ·
Shadowed white cards · icon chip rows · five tabs.
```

## Repo setup, CLAUDE.md, and skills

Three files make Claude Code behave: `CLAUDE.md` (how to work), `docs/MOBILE-DESIGN.md` (how it looks), and `docs/tickets/` (what to build, one file each). The PRD itself lives at `docs/PRD.md` for reference and is not re-read every session.

**CLAUDE.md** (copy verbatim to the repo root):

```markdown
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
```

**Skills to install (once, global).** In a terminal, not inside Claude Code:

```bash
claude plugin marketplace add draftbit/mobile-taste-skill
claude plugin install mobile-taste-skill
npx skills add https://github.com/vercel-labs/agent-skills   # react-native-skills + web-design-guidelines
```

Then, inside the repo, the first Claude Code session runs `/mobile-design-system` once so the skill reads `docs/MOBILE-DESIGN.md` and writes `tailwind.config.ts` and `theme/tokens.ts` from it (ticket T-02). After that, `mobile-taste` fires on its own for screen work; `/mobile-design-review` is run at the end of each phase. Anthropic's `frontend-design` is web-only and not needed here; its rules are already folded into MOBILE-DESIGN.md.

**Ticket file format** (`docs/tickets/T-07-today-screen.md`):

```markdown
# T-07 Today screen
Phase: 2 · Depends on: T-05, T-06 · PRD: User flows, Recommendation pipeline

## Goal
One sentence.

## Acceptance criteria
- [ ] ...
- [ ] ...

## Notes
Anything the PRD leaves open, decided here.

## Result
(Claude Code fills this)
```

## Tickets

Twenty-two tickets in five phases, each sized for one Claude Code session (one to three hours). Order is the dependency order; do not reorder within a phase without reason. Each row's criteria become the checklist in its ticket file.

**Phase 0: foundations (no UI yet).**

| Id | Ticket | Acceptance criteria |
| --- | --- | --- |
| T-01 | Monorepo scaffold | pnpm workspaces; `apps/mobile` from `create-expo-app` with Expo Router and TypeScript strict; `packages/stylist`, `packages/schema`, `functions`, `services/cutout` folders with package.json each; `pnpm lint/typecheck/test` run clean (empty tests); CLAUDE.md and docs/ in place; \`npx expo start --web\` renders the index route in a browser |
| T-02 | Design tokens | `/mobile-design-system` run; `tailwind.config.ts` and `theme/tokens.ts` contain every token from MOBILE-DESIGN.md in both modes; `useColorScheme` wired; Bodoni Moda and Archivo load before splash hide; a `Playground` route renders every type role and radius once |
| T-03 | UI primitives | Reusables installed; `Button` (primary 56/12, pill secondary), `Chip` (pill, selected state), `Input` (44/10), `Hairline`, `SectionRule`, `TabBar` (three text tabs, Bodoni, active italic), `ThemeToggle`; each has a story in Playground; press spring 0.97 on all |
| T-04 | Firebase project | dev project in asia-south1; Auth with Google; Firestore and Storage rules from PRD; `google-services.json` via EAS env; sign-in screen works on a dev build; `testers` collection exists with your email |
| T-05 | Schema package | zod schemas for Profile, Piece, Look, Event, Usage matching the Firestore table; exported types; round-trip tests |

**Phase 1: the closet.**

| Id | Ticket | Acceptance criteria |
| --- | --- | --- |
| T-06 | Profile screen | matches Onboarding artboard; height input numeric keyboard; build, contrast, occasions chips; writes `users/{uid}`; reachable again from You; `profileVersion` increments on change |
| T-07 | Cutout service | Cloud Run FastAPI + rembg BiRefNet; POST image, GET PNG with alpha; p95 under 15 s cold, under 3 s warm; deployed; a curl test documented |
| T-08 | tagPiece function | callable; checks tester + daily cap; calls cutout, k-means colour (k=3) on masked pixels, Gemini Flash with strict JSON schema; writes piece; unit test with a fixture image and mocked Gemini; increments usage |
| T-09 | Add a piece screen | matches AddItem artboard; camera and gallery; permission asked on tap; resize to 1024; upload; shows cutout with corner marks and caption; tags as tappable rows, wrong ones struck through and editable; five-slot progress; "Looks right, next piece"; discard confirm only after a photo |
| T-10 | Closet screen | matches Closet artboard; FlashList grid by slot with wear counts; piece detail push with tag edit, away, archive; empty state copy from MOBILE-DESIGN; offline reads from TanStack cache |

**Phase 2: the stylist.**

| Id | Ticket | Acceptance criteria |
| --- | --- | --- |
| T-11 | Rules engine core | `packages/stylist`: Piece model, hard constraints, candidate generation; fixture closet of 18 pieces; tests assert counts and that every candidate passes every constraint; under 100 ms for 30 pieces |
| T-12 | Rules engine scoring | all soft rules from PRD with weights file; `explain(outfit)` returns top-3 reasons by contribution; deterministic ranked list for the fixture; snapshot test |
| T-13 | Indian layer and step-up | kurta, nehru-jacket, kolhapuri, wedding/puja rules; fabric-by-season; step-up swap finder; tests |
| T-14 | explainLooks function | callable; cache key per PRD; Gemini prompt that returns titles and reasons for 3 of 12; validator rejects unknown rule ids; falls back to engine strings; usage cap; tests with mocked Gemini |
| T-15 | Today screen | matches Main artboard; occasion tabs remembered per weekday; three looks with tilted flat-lays from cutouts; engine results shown instantly, LLM titles swapped in; "Show me different ones" free; usage line; chevron to detail |
| T-16 | Look detail | matches Detail artboard; rule cards from engine reasons; step-up card when present; "Wear this today" writes events and returns; three not-for-me reasons write rejection |
| T-17 | Feedback and affinity | `onWear` trigger updates wears, lastWorn, affinity; affinity rule reads it; freshness rule honours lastWorn; test that a rejected pair ranks lower next day |

**Phase 3: gap, caps, You.**

| Id | Ticket | Acceptance criteria |
| --- | --- | --- |
| T-18 | Gap finder | archetype list; simulate-add delta; `computeGap` on piece add/archive; Closet gap card with Myntra search URL (no affiliate yet); Not now hides 14 days |
| T-19 | Usage caps and kill switch | `usage.ts` transaction; caps 10/3/10; tester allowlist on every callable; Remote Config `aiEnabled`; You tab shows counters; app fully usable with AI off |
| T-20 | You tab | profile edit, theme toggle (and remove header toggles), counters, sign out, delete account and data (Function that wipes user docs and storage) |

**Phase 4: ship to testers.**

| Id | Ticket | Acceptance criteria |
| --- | --- | --- |
| T-21 | Design review and states | `/mobile-design-review` run and findings fixed; every data screen has loading skeleton, empty, error, offline states; 1.3x font scale checked on device; dark mode walked on every screen |
| T-22 | Release | prod Firebase project; EAS build; Play internal testing track; \`npx expo export --platform web\` deployed to Firebase Hosting with a custom domain; 20 tester emails in `testers`; billing budget alert; a one-page tester guide in docs/ |

After T-22 the next tickets are decided from tester data, not from this list.

## How to run this with Claude Code

Do not paste the whole PRD into a prompt. A 20-page document in one session makes Claude Code plan everything and build nothing well. The PRD lives in the repo as files; each session gets one ticket.

**GitHub issues or ticket files?** Both, with a clear split. The repo is [github.com/debajit13/placket](https://github.com/debajit13/placket) (public, MIT, `main` branch, issues enabled; as of 3 Nov 2026 it holds only the LICENSE). The ticket files in `docs/tickets/` are the source of truth and live in the repo; each one is also opened as a GitHub issue (same title, same checklist) so there is a board, and Claude Code works from the issue number. Every ticket is one branch, one pull request that closes its issue, and you merge. Claude Code pushes branches and opens PRs; it never pushes to `main`.

**One-time setup (about 30 minutes).**

1. Export this doc as Markdown and save it as `docs/PRD.md`. Copy the MOBILE-DESIGN block into `docs/MOBILE-DESIGN.md` and the CLAUDE.md block into `CLAUDE.md` at the root.
2. Create `docs/tickets/T-01-...md` through `T-22-...md` from the Tickets table using the ticket file format. The starter zip already contains them. Then create the issues from the files with the gh CLI, one per file, labelled by phase: \`for f in docs/tickets/T-\*.md; do gh issue create --title "$(head -1 $f | sed 's/^# //')" --body-file $f --label "phase-$(grep -o 'Phase: \[0-9\]' $f | cut -c8)"; done\` (create the five phase labels first with \`gh label create phase-0\` and so on). Write each issue number back into its ticket file's first line.
3. Install the skills (Repo setup section). Create the Firebase dev project by hand in the console; Claude Code cannot click through that.
4. `Clone git@github.com:debajit13/placket.git, add the starter files beside the LICENSE, commit to main and push. Protect main in the repo settings (require a pull request), so Claude Code's pushes can only land as PRs`.

**Per-ticket loop (repeat 22 times).**

1. Open a fresh Claude Code session in the repo. Fresh matters: context from the last ticket is noise for this one, and CLAUDE.md reloads the rules.
2. Prompt: `Work on issue #7 (docs/tickets/T-07-today-screen.md). Read CLAUDE.md and docs/MOBILE-DESIGN.md first. Create a branch t-07-today-screen from main, restate the acceptance criteria as a checklist, tell me which files you will touch, then wait for my go.`
3. Read the plan. If it touches files outside the ticket's scope, say so. Then: `Go.`
4. When it says done, do not take its word for it: run `pnpm test`, open the app on your phone, walk the screen in light and dark. For UI tickets, compare against the artboard side by side.
5. If something is off: `Criterion 3 is not met: the chips have square corners. Fix only that.` Keep corrections to one criterion per message.
6. When it passes: `Fill the Result section of the ticket`, commit with message "T-07 Today screen", push the branch, and open a pull request titled "T-07 Today screen" whose body says "Closes #7" and lists the evidence for each criterion. You review the PR on GitHub and merge it; merging closes the issue.
7. At the end of each phase, one extra session: `Run /mobile-design-review on apps/mobile and fix only high and medium findings. Write the report to docs/reviews/phase-2.md.`

**Prompts that work.**

- "Before coding, list three ways this ticket could go wrong and which one you will guard against." (good for T-08, T-14)
- "Show me the fixture closet as a table before writing tests." (T-11)
- "Compare the screen you built with the description in the ticket and list every difference." (any UI ticket)
- "This looks like a default card layout. Re-read MOBILE-DESIGN.md Structure rules and rebuild without cards."

**What not to do.**

- Do not run two tickets in one session, even small ones. Drift between screens is exactly what MOBILE-DESIGN.md exists to prevent.
- Do not let it change MOBILE-DESIGN.md or CLAUDE.md to make a ticket pass. If a rule is wrong, change it yourself in a separate commit and say why.
- Do not accept "should work" for device checks. Keyboard, font scale, and edge-to-edge are device-only.
- Do not give it the Gemini key in chat. Put it in Functions config and tell it the name.
- Do not ask for iOS-specific work until there is an Apple account; nothing in the plan is Android-only, so nothing is lost by waiting.

**When a ticket turns out wrong.** Edit the ticket file, note what changed under Notes, and start a fresh session. Tickets are the plan, and the plan is allowed to change; sessions are not.

## Out of scope and open questions

**Deferred, with the trigger that brings each back.**

| Feature | Why it waits | Comes back when |
| --- | --- | --- |
| Virtual try-on | Every hosted model is one garment per call, 60 to 80 s, and poor on Indian drapes; it would be the most expensive and least reliable thing in the app | a multi-garment model is stable, or testers ask for it more than for anything else |
| Body measurement from a selfie | Centimetre accuracy from one casual photo is not real; height plus build plus contrast gives the rules what they need | never for v1; maybe size charts in v2 |
| Womenswear and sarees | Draping is a different problem and the closets are three to five times larger | the men's loop retains testers |
| Email import from Myntra and Amazon orders | Gmail OAuth review and a parser are a project of their own | more than half of testers stall before five pieces |
| Weather and calendar | A manual occasion pick is enough to test the stylist | after T-22, as one ticket each |
| Affiliate links | Myntra pays 5 to 10% and Amazon 7%; meaningless at 20 users | 500 active users or a brand conversation |
| Web-only extras | The web build ships every screen from day one; drag-and-drop bulk upload and keyboard shortcuts are extra work | testers use the web build for adding many pieces at once |

**Open questions to settle before Phase 1.**

- [ ] Season bands: the plains calendar (hot Mar to Oct) is wrong for the hills. Use device location to pick a band, or ask once in Profile?
- [ ] Archetype list for the gap finder: start with 12 menswear archetypes, or let the engine derive gaps from the colour and formality grid?
- [ ] Do testers see each other's existence at all? Current answer: no, fully private, and no social surface until there is a reason.
- [ ] Data deletion: wipe immediately on request, or a 7-day soft delete? DPDP Act favours a clear deletion path; immediate is simpler.
- [ ] App name: decided, Placket (3 Nov 2026). FitCheck was the working title and "FitCheck AI" is taken. Checked on 3 Nov 2026: Taiyaar is taken in this exact category ("Taiyaar: South Asian Outfits", Built by Foundry, App Store, 2026); Pehno collides with "Kya Pehnu: Outfit Planner AI" on Play and Khush Pehno; Almari has three wardrobe apps; Pehnava, Darzi, Libas, Poshak, Istri and Thread- names are taken or crowded. Jamega and Chalega were clear but judged too ordinary. A deeper naming study (25 candidates, 12 searched on both stores) left two: Saleeqa (सलीक़ा, the knack of doing things properly; no app on either store, but used by Indian and Pakistani womenswear sellers, so the Class 25 and 42 trademark search decides it) and Placket (the buttoned strip on a shirt or kurta front; no app or brand anywhere, one unpublished GitHub side project of the same name). Fallbacks: Durust ("correct"; a Pakistan government price app owns it there), Good Collar (clean but hard to trademark). Chosen: Placket. Still to do before T-22: IP India search in classes 9, 25 and 42; register placket.in and placket.app; claim the Play, App Store, GitHub, X and Instagram handles; glance at the GitHub "Placket" repo once more for activity.

**Sources behind the decisions in this PRD** (market, try-on, and skill research from the planning conversation): [fal.ai try-on API roundup](https://fal.ai/learn/tools/best-virtual-try-on-apis-2026), [FASHN roadmap](https://fashn.ai/blog/fashn-virtual-try-on-product-roadmap), [background removal comparison](https://aireiter.com/blog/best-background-removal-api), [Fashionpedia](https://arxiv.org/pdf/2004.12276), [Google Photos virtual closet](https://techcrunch.com/2026/09/24/google-photos-clueless-inspired-virtual-closet-is-now-available-on-android-and-ios/), [Alta Series A](https://fortune.com/2026/10/22/alta-ai-fashion-app-series-a-20-million-forerunner-rent-the-runway/), [Indyx vs Cladwell](https://www.myindyx.com/versus/indyx-vs-cladwell), [Myntra My Stylist](https://www.alchempro.com/news/e-commerce-industry/india-s-myntra-launches-ai-driven-feature-for-customised-fashion-tips-287719-newsdetails.htm), [Myntra affiliate rates](https://earnyatra.com/myntra-affiliate-program/), [mobile-taste-skill](https://github.com/draftbit/mobile-taste-skill), [Vercel agent-skills](https://github.com/vercel-labs/agent-skills).
