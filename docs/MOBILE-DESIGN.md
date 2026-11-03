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
