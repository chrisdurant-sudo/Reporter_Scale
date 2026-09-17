# Design rules

Show what matters, make the next step obvious, keep the explanation one click away.

## Names
App: **Reporter Growth**. Navigation: **Markets / Reporters / Improvements**.
Use: First job completed, Next step, Assigned to, Due, Found through, Screening, Onboarding,
Continue, Change, Stop, Save as process, Not enough results yet.
Avoid: activation engine, intervention, optimization, cohort velocity, or ambiguous Active labels.
Precise technical names are fine in code; working copy stays plain.

## Layout
- One desktop market-selector row: All markets, LAX, SFO, DFW, ORD, ATL. A mobile dropdown replaces it, never duplicates it.
- Show full market names in context. Persist selection across tabs; close a detail panel that no longer matches the filter.
- Markets: compact progress table with visible counts, then a selected-market planning view. Avoid a wall of KPI cards.
- Reporters: current-stage counts, concise list, right-hand details; preserve the list position. Mobile details may fill the screen.
- Improvements: compact change/result cards with evidence, owner, and next action. Put history and definitions behind details.
- About this demo belongs in the footer. No Connect to Steno button or fake live-status indicator.

## Appearance
Light background, white working surfaces, dark readable text, subtle borders, one restrained accent.
The setup owner freezes the palette and shared spacing/type tokens. Feature agents do not invent new palettes.
Use color with text, not as its substitute. Icons supplement labels. No decorative map, fake photos,
animated counters, oversized headings, or styling that makes the app look like the fleet command center.
Remove content before shrinking type; target body text of at least 14px.

## Component strategy
Reuse a compatible existing system. In a fresh repo, the coordinator can select a small Tailwind/shadcn/Lucide setup
or a comparably compact existing approach during setup only. No parallel package changes.
Freeze the props of shared buttons, detail panel, empty state, notice, and shell before dispatch.
Experience owns those implementations. Features use the frozen exports and scoped local styling.
Do not add a chart library until a specific required chart needs it; CSS progress bars are sufficient for the market table.

## Interaction requirements
Useful empty/error/loading states; visible labels and focus; keyboard controls; accessible panel close and focus return.
No essential hover-only instructions. Test at 390px, 1280px, and 1440px, including keyboard and reduced motion.
Bounded table scrolling is acceptable; horizontal overflow of the whole page is not.
A visible action works or clearly says Preview. A saved task or plan never fabricates a completed job.
Distinguish current-stage snapshots, historical conversion, planning assumptions, and simulated outcomes.
