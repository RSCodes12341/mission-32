# Product

## Register

product

## Users

A small, closed friend group — under a dozen people who already know each other — working
through one shared physical challenge together: 32 sessions, being 15 rides (7 of them pit
explorations) and 10 sport days.

Their context is the important part. They open this **immediately after exercising**: one
-handed, outdoors, on a phone, possibly cold, wet, tired, or in bad light, with a photo
they just took. They are not sitting at a desk. The whole visit is 20 seconds long and
happens maybe once a day.

The job: record what I just did, see whether the group is on track, and get out.

## Product Purpose

Turn a group promise into something visible, so it survives contact with a busy month.
Social accountability is the mechanism — the tally is shared, so slacking is visible and
progress is contagious.

Success is not engagement. Success is that all 32 sessions get logged and nobody has to
nag anybody. If someone opens the app, logs a ride, and closes it without thinking about
the interface, it worked.

## Brand Personality

Plain-spoken, unsentimental, quietly competitive. It keeps score without commentary — no
streak guilt, no confetti, no motivational copy. The satisfaction comes from the number
going up, so the interface should get out of the way and let it.

Three words: **direct, durable, understated.**

## Anti-references

- **Consumer fitness apps** (Strava, Nike Run Club, Fitbit) — badges, celebration
  animations, "You're crushing it!", gamified pressure. Wrong tone entirely for a group
  who just want a shared list.
- **Dashboard-template SaaS** — hero metric cards with gradient accents, sparkline
  filler, chart-for-the-sake-of-chart.
- **Anything that requires a tutorial.** If a member needs an explanation to log a ride,
  it has failed.

## Design Principles

1. **Logging is the product.** Every screen is measured by how many taps stand between
   opening the app and a saved entry. Nothing outranks that path.
2. **Thumb-first, always.** Designed for one hand on a phone, outdoors, in a hurry. Touch
   targets and legibility win over density every time.
3. **The tally is the reward.** Progress toward 32 is the only thing that gets to be
   visually loud. Everything else recedes.
4. **Nothing that looks interactive should be inert.** If it reads as a card, a button, or
   a row, tapping it does the obvious thing. This principle exists because violating it is
   exactly how the first version failed.
5. **Honest, never chirpy.** State what happened. No exclamation marks, no encouragement,
   no shame.

## Accessibility & Inclusion

- WCAG 2.2 AA. Body text ≥4.5:1, large text ≥3:1, verified per theme and per accent.
- Touch targets ≥44×44px — non-negotiable given the outdoor, one-handed context.
- User-selectable accent colour must never be the sole carrier of meaning. Activity types
  stay distinguishable by label and position, not just hue, for colour-blind users.
- Full `prefers-reduced-motion` alternatives. Motion only ever conveys state.
- Must remain usable in bright outdoor sunlight — a real argument for a genuinely light
  light-theme, not a washed-out grey one.
