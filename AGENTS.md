# AGENTS.md

## Project Context

SnapBrain is an offline-first mobile app for organizing screenshots as structured **Captures**. A Capture is an imported screenshot reference plus local metadata. The app is not a gallery replacement and does not own the original screenshot file in MVP.

MVP direction:

- folderless global Library
- manual multi-select screenshot import
- tags, notes, reminders, search, and smart views
- private, lightweight, local-first behavior
- Android first, but keep iOS-compatible where practical

Primary source of truth for product and architecture decisions:

- `docs/product-spec.md`
- `docs/technical-architecture.md`

If a task conflicts with those docs, follow the docs and call out the conflict.

## Non-Negotiable Product Rules

- MVP is folderless. Do not add folders, folder hierarchy, or folder-based navigation.
- All Captures live in one global Library.
- Organization in MVP is through tags, notes, reminders, search, and smart views.
- Use the term **Capture** consistently. Do not rename the core entity to screenshot, item, document, or card in code without a strong reason.
- `Unsorted` means: a Capture has no tags and no note.
- Deleting a Capture deletes SnapBrain metadata only. It does not delete the original screenshot from device storage.
- Missing original files move the Capture into graveyard state. Graveyard is a smart section/filter within the Library, not a separate storage model.
- Graveyard items must support relink or permanent metadata deletion.
- Tags are case-insensitive, normalized to lowercase, and emoji-safe.
- Tag operations must support rename, merge, and delete without duplicating canonical tags.
- Notes are multi-line, optional, and capped at 300 characters. Do not add a title field in MVP.
- One reminder per Capture in MVP. Do not introduce recurring or multi-reminder models.
- Search in MVP covers tags and note text. Do not assume OCR exists yet.
- Navigation baseline is:
  - Library
  - Search
  - Reminders
  - Tags
  - Settings
  - Add Capture via FAB
- Backup/export is metadata-first. Do not describe it as full screenshot backup or full asset restore.

## Technical Constraints

- React Native only.
- Expo Managed workflow only.
- TypeScript only.
- Local-first and offline-first by default.
- Store source URI / asset reference plus local metadata.
- Do not copy original screenshot files into app storage in MVP.
- Keep the architecture ready for OCR, better search, collections, auto-import, duplicate detection, and cloud sync later, but do not build speculative infrastructure with no current use.
- Prefer the architecture already chosen in `docs/technical-architecture.md`:
  - Expo Router
  - `expo-sqlite`
  - Zustand for ephemeral UI state only
  - `expo-media-library`
  - `expo-notifications`
  - `expo-image`
  - FlashList for large feeds

## Working Style for Coding Agents

- Read the relevant repo files before making non-trivial changes. At minimum, check the product and architecture docs when touching behavior or structure.
- Preserve existing good code. Improve locally instead of rewriting broadly.
- Prefer small, coherent, reviewable changes over giant one-shot rewrites.
- Keep the repo runnable after each milestone.
- Continue with unblocked work when possible. If blocked, state the blocker clearly and narrowly.
- Do not add dependencies without a concrete need and a short justification.
- Do not create duplicate sources of truth. Persistent app data belongs in the database, not mirrored into ad hoc global state.
- Keep UI, domain logic, and persistence separated. Screens should not own raw SQL or direct device API orchestration.
- Use the naming and model boundaries from the architecture doc unless there is a documented reason to change them.
- When making architecture tradeoffs, document the decision briefly in code comments or task summary if it affects future work.

## Validation Rules

- Run lint after edits if lint is configured.
- Run typecheck after edits if typecheck is configured.
- Run the most relevant tests for the changed code if tests exist.
- For data-heavy or logic-heavy changes, prefer targeted validation over no validation.
- Report exactly what you validated and what you could not validate.
- Do not claim success without verification.
- If scripts or tooling are missing, say so plainly instead of implying they ran.

## Implementation Priorities

- Follow `docs/product-spec.md` and `docs/technical-architecture.md`.
- Build in phases. Do not jump ahead with speculative features.
- Keep the architecture maintainable and explicit.
- Treat 5k to 10k Captures as a real scale target when making data, search, and list-rendering decisions.
- Prefer DB-backed truth for Captures, Tags, Reminders, Settings, and Recent Searches.
- Keep transient workflow state lightweight and disposable.
- Optimize for import reliability, search responsiveness, reminder correctness, and browsing performance.

## What to Avoid

- Reintroducing folders into MVP.
- Pretending backup/export includes screenshot assets.
- Assuming OCR exists now.
- Assuming auto-import exists now.
- Assuming cloud sync or account systems exist now.
- Adding title fields, heavy metadata forms, or document-management complexity to MVP.
- Over-abstracting early with plugin systems, generic engines, or unused adapters.
- Heavy dependency sprawl.
- Giant rewrites that mix architecture changes with feature work without a clear reason.

## Repo Behavior Expectations

- Use existing conventions and align new code with the architecture doc’s structure.
- Keep naming consistent with the product docs.
- Use `Capture`, `Tag`, `Reminder`, `RecentSearch`, and `Settings` terminology consistently.
- Keep business rules close to domain services and persistence logic close to repositories.
- Keep route structure, navigation behavior, and feature boundaries aligned with the architecture doc.
- Leave files clean, focused, and internally consistent after each task.
- If you intentionally diverge from the architecture document, explain why in the task summary and keep the divergence minimal.

## Practical Defaults

- Prefer explicit repository/service code over opaque abstractions.
- Prefer transactions for batch import writes.
- Prefer indexed queries over JS-side filtering for large datasets.
- Prefer lazy verification for missing-source checks; do not do expensive file checks during normal browsing.
- Prefer warning-based duplicate detection in MVP, not hard blocking.
- Prefer honest placeholder handling for future features rather than fake or partial implementations.
