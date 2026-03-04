# SnapBrain Technical Architecture

## A. Architecture Summary

SnapBrain should be built as an offline-first, database-centered Expo app where SQLite is the canonical source of truth for all user data: captures, tags, reminders, recent searches, graveyard state, and settings. The app remains folderless in MVP. A Capture is a local metadata record that references an original screenshot in the device media library or file system without copying the asset into app storage.

The recommended architecture is a hybrid feature-plus-platform-modules structure:

- `app/` owns routing and screen entry points.
- `features/` owns feature UI, feature hooks, and feature-specific orchestration.
- `db/` and `modules/` own persistence, repositories, device integrations, and domain services.
- SQLite-backed repositories expose domain-safe operations; screens should not issue raw SQL.
- Zustand stores only ephemeral UI state and workflow drafts; it is not a second source of truth for captures.

This fits Expo Managed because the core requirements are supported by Expo-friendly modules: file-based routing, SQLite persistence, media library access, image rendering, local notifications, and filesystem export. The architecture stays compatible with iOS, but is optimized for Android-first behavior and performance.

Main technical risks:

- media-permission and gallery-access tradeoffs on Android and iOS
- exact reminder timing on Android due to notification/alarm platform behavior
- avoiding expensive missing-file checks during normal browsing
- keeping live search fast at 5,000 to 10,000 captures
- keeping list/grid rendering stable when thumbnails come from external URIs
- future-proofing for OCR and cloud sync without polluting MVP

## B. Recommended Technical Stack

### B.1 Chosen Stack

| Concern | Recommendation | Why | Alternatives |
| --- | --- | --- | --- |
| App runtime | Expo Managed workflow, TypeScript, Continuous Native Generation enabled | Keeps native integration manageable while still allowing config plugins and production builds | Bare React Native only if native OCR/custom media code becomes mandatory |
| Routing/navigation | Expo Router | Expo-recommended, typed file-based routes, deep-link ready, built on React Navigation | React Navigation directly if the team strongly prefers manual config |
| Local database | `expo-sqlite` with hand-written SQL repositories and migration runner | Best fit for offline-first data, exportable backup, indexed queries, future FTS/OCR support | Drizzle ORM over SQLite if the team wants schema DSL; not recommended for MVP |
| Async app state | Zustand | Small API, low ceremony, good for import drafts, filters, and transient UI state | Jotai for finer-grained atoms; Redux Toolkit is heavier than needed |
| Forms/input | No form library in MVP; use controlled inputs + Zod validators | Most inputs are inline and small; avoids form abstraction overhead | React Hook Form if import/settings forms grow later |
| Validation | Zod | Strong runtime validation at module boundaries, import payload parsing, settings parsing | Valibot is viable; Zod is more common and easier for AI agents |
| Media access/import | `expo-media-library` via a custom import browser | Needed for multi-select, metadata access, asset IDs, relink flow, and future change listeners | `expo-image-picker` is simpler but weaker for asset tracking and graveyard handling |
| Notifications | `expo-notifications` | Expo-native local reminder scheduling and response handling | Native alarm manager customization only if exact alarm behavior becomes critical |
| Image rendering | `expo-image` | Better caching and decoding than core `Image`, good for grids and detail preview | Core `Image` is acceptable but less performant |
| Lists | `@shopify/flash-list` | Better Android performance for 5k to 10k capture browsing | `FlatList` only if project constraints block FlashList |
| Date/time | `date-fns` | Good enough for formatting and reminder calculations without heavy abstraction | Luxon if timezone logic becomes more complex |
| Filesystem/export | `expo-file-system` + `expo-sharing` | Needed for SQLite export and diagnostics | none |
| Preferences storage | SQLite `settings` table as canonical store | Keeps backup/export honest and avoids split storage | AsyncStorage only for non-critical cache, not source of truth |
| Testing | `jest-expo`, `@testing-library/react-native`, repository tests against temp SQLite DB, Maestro E2E | Balanced coverage for logic-heavy offline app | Detox if deeper native automation is later needed |

### B.2 Why This Stack Fits Expo Managed

- Expo Router is the current Expo-recommended navigation path and preserves native navigation behavior while reducing route boilerplate.
- `expo-sqlite` is bundled for Expo projects and persists data across restarts.
- `expo-media-library` provides direct media library access and change subscriptions, which is more useful than a system picker for this product.
- `expo-notifications` supports local scheduled notifications in Expo, but reminder accuracy still needs reconciliation logic.
- `expo-image` and FlashList are the main performance levers for a screenshot-heavy app.

### B.3 Stack Tradeoffs

- A custom import browser based on `expo-media-library` gives better metadata and asset tracking, but requires broader photo access and more UI work than a system picker.
- Raw SQL repositories require discipline, but they keep query control explicit and make FTS, indexing, and backup/export simpler.
- Storing settings in SQLite is slightly more formal than AsyncStorage, but it avoids backup inconsistency and duplicate persistence logic.

## C. High-Level Architecture

### C.1 Layered System

```text
UI Screens / Feature Components
        |
Navigation + Route Params
        |
Feature Hooks / View Models
        |
Domain Services
        |
Repositories
        |
SQLite / Device Modules
```

### C.2 Layers and Responsibilities

| Layer | Responsibilities | Should depend on | Must not depend on |
| --- | --- | --- | --- |
| Presentation/UI | screen layout, rendering, gestures, user input, list/grid toggles, modals | feature hooks, theme, shared UI components | raw SQL, direct media APIs, notification APIs |
| Navigation | route grouping, modal presentation, tab structure, deep links | screen components | repository internals |
| State | ephemeral UI state, import draft state, search input state, pending filter selections | domain services, repositories through hooks | duplicate persistent copies of Capture/Tag data |
| Domain logic | tag normalization, unsorted calculation, duplicate scoring, reminder reconciliation, graveyard transitions | repositories, platform adapters | direct UI rendering |
| Persistence/data | schema, migrations, SQL queries, transactions, indexed search queries | SQLite module | React components |
| Media access | list media assets, fetch asset metadata, verify asset existence, resolve fresh URIs | Expo media/file modules | UI-specific decisions |
| Notification/reminder | schedule, cancel, reschedule, reconcile reminder state | expo-notifications, reminder repository | screen state |
| Search/filter | build search docs, execute search queries, recent search persistence | search repository, capture/tag repository | presentation concerns |
| Settings/preferences | read/write app preferences, export metadata, diagnostics | settings repository, filesystem | arbitrary component state |
| Future OCR | extract text, persist OCR status/text, feed search index | OCR adapter, repositories | direct dependency from unrelated screens |

### C.3 Dependency Rules

- Screens talk to feature hooks or feature services, not directly to repositories.
- Repositories own SQL. Domain services own business rules that span multiple tables.
- Platform adapters hide Expo modules behind interfaces such as `MediaGateway` and `ReminderScheduler`.
- Search indexing is fed by capture/tag/note/reminder mutations; it is not edited directly from screens.
- Graveyard detection is a domain concern using media gateway verification, not a UI concern.

## D. Suggested Project Structure

### D.1 Recommended Organization: Hybrid

Use a hybrid structure:

- feature-first for screen-facing code and view-specific hooks
- layer-first for shared infrastructure such as DB, services, theme, and platform adapters

This keeps features easy to extend without spreading SQLite and Expo device logic into UI folders.

### D.2 Proposed Tree

```text
snapbrain/
  app/
    _layout.tsx
    +not-found.tsx
    (tabs)/
      _layout.tsx
      library/
        index.tsx
      search/
        index.tsx
      reminders/
        index.tsx
      tags/
        index.tsx
      settings/
        index.tsx
    capture/
      [captureId].tsx
      [captureId]/preview.tsx
    tags/
      [tagId].tsx
    reminders/
      [captureId].tsx
    settings/
      notifications.tsx
      storage.tsx
      backup.tsx
      about.tsx
      onboarding.tsx
    modals/
      import/
        picker.tsx
        review.tsx
      tag-editor.tsx
      date-time-picker.tsx
      filter-sheet.tsx
      relink.tsx

  assets/
    fonts/
    images/

  components/
    primitives/
      AppScreen.tsx
      AppText.tsx
      AppPressable.tsx
      AppIcon.tsx
    feedback/
      EmptyState.tsx
      ErrorState.tsx
      InlineBanner.tsx
    lists/
      GridToggle.tsx
      SmartSectionHeader.tsx
    tags/
      TagChip.tsx
      TagInput.tsx
    reminders/
      ReminderBadge.tsx
    media/
      CaptureThumbnail.tsx
      MissingThumbnail.tsx

  constants/
    app.ts
    routes.ts
    search.ts
    reminders.ts
    limits.ts

  db/
    client.ts
    migrations/
      0001_initial.ts
      0002_capture_search.ts
    migrationRunner.ts
    schema/
      sql.ts
    queries/
      captures.sql.ts
      tags.sql.ts
      reminders.sql.ts
      search.sql.ts
      settings.sql.ts

  features/
    library/
      components/
        LibraryGridCard.tsx
        LibraryListRow.tsx
        SmartViewsRail.tsx
        LibraryFilterBar.tsx
      hooks/
        useLibraryFeed.ts
        useLibraryViewMode.ts
      screens/
        LibraryScreen.tsx
      types.ts
    capture-detail/
      components/
        CaptureHeader.tsx
        CaptureMetadataSection.tsx
        NoteEditor.tsx
      hooks/
        useCaptureDetail.ts
        useCaptureActions.ts
      screens/
        CaptureDetailScreen.tsx
    import/
      components/
        AssetPickerGrid.tsx
        ImportReviewSheet.tsx
        DuplicateWarningCard.tsx
      hooks/
        useImportAssets.ts
        useImportDraft.ts
      screens/
        ImportPickerScreen.tsx
        ImportReviewScreen.tsx
      types.ts
    search/
      components/
        SearchBar.tsx
        RecentSearchesList.tsx
        SearchFiltersSheet.tsx
      hooks/
        useCaptureSearch.ts
      screens/
        SearchScreen.tsx
    reminders/
      components/
        ReminderRow.tsx
        ReminderSection.tsx
      hooks/
        useRemindersFeed.ts
      screens/
        RemindersScreen.tsx
    tags/
      components/
        TagRow.tsx
        TagRenameSheet.tsx
      hooks/
        useTagsLibrary.ts
      screens/
        TagsScreen.tsx
        TagDetailScreen.tsx
    settings/
      components/
        SettingsRow.tsx
      screens/
        SettingsScreen.tsx
        StorageSettingsScreen.tsx
        BackupSettingsScreen.tsx

  hooks/
    useDebouncedValue.ts
    useAppFocus.ts
    usePermissionGate.ts

  modules/
    captures/
      capture.repository.ts
      capture.service.ts
      capture.types.ts
    tags/
      tag.repository.ts
      tag.service.ts
      tag.types.ts
    reminders/
      reminder.repository.ts
      reminder.service.ts
      reminder.scheduler.ts
    search/
      search.repository.ts
      search.service.ts
      searchIndexer.ts
    import/
      import.service.ts
      duplicate.service.ts
      import.types.ts
    graveyard/
      graveyard.service.ts
    media/
      media.gateway.ts
      media.types.ts
      expoMedia.gateway.ts
    settings/
      settings.repository.ts
      settings.service.ts
    backup/
      backup.service.ts
    diagnostics/
      diagnostics.service.ts

  store/
    ui.store.ts
    importDraft.store.ts
    search.store.ts
    domainEvents.store.ts

  theme/
    colors.ts
    spacing.ts
    typography.ts
    index.ts

  types/
    db.ts
    domain.ts
    navigation.ts

  utils/
    dates.ts
    strings.ts
    ids.ts
    result.ts

  tests/
    unit/
    integration/
    e2e/
    fixtures/
```

### D.3 Separation Rule

- Shared reusable UI stays in `components/`.
- Screen-specific UI stays under `features/<feature>/components`.
- Business logic stays under `modules/`.
- SQL and migrations stay under `db/`.
- `features/` may call `modules/`; `modules/` must not import `features/`.

## E. Navigation Architecture

### E.1 Primary Navigation

Bottom tabs:

1. Library
2. Search
3. Reminders
4. Tags
5. Settings

Global floating action button:

- visible on main tab screens
- opens the import flow modal stack

### E.2 Route Map

| Route | Purpose | Presentation |
| --- | --- | --- |
| `/(tabs)/library` | main browsing screen with smart views and grid/list library feed | tab root |
| `/(tabs)/search` | live search + recent searches + filtered results | tab root |
| `/(tabs)/reminders` | upcoming, overdue, completed reminders | tab root |
| `/(tabs)/tags` | tag library, counts, rename/merge/delete entry point | tab root |
| `/(tabs)/settings` | settings home | tab root |
| `/capture/[captureId]` | capture detail with inline metadata editing | pushed stack screen |
| `/capture/[captureId]/preview` | fullscreen zoomable single-image preview | modal or full-screen modal |
| `/tags/[tagId]` | captures filtered by tag | pushed stack screen |
| `/reminders/[captureId]` | reminder-focused detail entry | pushed stack screen |
| `/modals/import/picker` | custom screenshot picker | modal |
| `/modals/import/review` | metadata review before save | modal |
| `/modals/filter-sheet` | reusable filter sheet | modal |
| `/modals/date-time-picker` | reminder date/time selection | modal sheet |
| `/modals/tag-editor` | quick add/edit tag actions | modal sheet |
| `/modals/relink` | relink missing source | modal |
| `/settings/notifications` | notification settings/help | pushed stack screen |
| `/settings/storage` | diagnostics and graveyard management | pushed stack screen |
| `/settings/backup` | metadata export | pushed stack screen |
| `/settings/about` | app info | pushed stack screen |
| `/settings/onboarding` | replay onboarding | pushed stack screen |

### E.3 Expo Router Structure

```text
app/
  _layout.tsx              # root Stack
  (tabs)/
    _layout.tsx            # Tabs + global FAB
    library/index.tsx
    search/index.tsx
    reminders/index.tsx
    tags/index.tsx
    settings/index.tsx
  capture/[captureId].tsx
  capture/[captureId]/preview.tsx
  tags/[tagId].tsx
  reminders/[captureId].tsx
  settings/...
  modals/import/picker.tsx
  modals/import/review.tsx
  modals/filter-sheet.tsx
  modals/date-time-picker.tsx
  modals/tag-editor.tsx
  modals/relink.tsx
```

### E.4 Navigation Behavior

- Capture detail should be reachable from Library, Search, Reminders, Tags, and graveyard results with the same route.
- Fullscreen preview should open from detail, not from grid directly in MVP.
- Search results default to list mode regardless of the Library view preference.
- Tag detail route should be a filtered capture feed, not a separate data model.
- Import routes should be modal so dismissing the flow returns the user to the previous tab.
- Back from `/modals/import/review` returns to picker with draft preserved.
- Back from detail returns to the originating tab and scroll position.

### E.5 Deep Link Readiness

Prepare routes now even if not used in MVP:

- `snapbrain://capture/:captureId`
- `snapbrain://tags/:tagId`
- `snapbrain://reminders/:captureId`
- `snapbrain://settings/backup`

This helps later for notification taps and optional sync/share flows.

## F. Domain Model

### F.1 Core Entities

| Entity | Purpose | Key relationships | Core business rules |
| --- | --- | --- | --- |
| Capture | metadata record for one imported screenshot | many-to-many with Tag, one-to-one with Reminder | no folders, no title, note max 300 chars, delete removes only SnapBrain metadata |
| Tag | normalized label used for organization | many-to-many with Capture | case-insensitive, normalized to lowercase, emoji allowed |
| CaptureTag | join record between Capture and Tag | belongs to Capture and Tag | unique per capture/tag pair |
| Reminder | optional action prompt for one Capture | one-to-one with Capture | max one reminder per capture, date+time based |
| RecentSearch | previously used search query/filter combination | none | prune to bounded size, dedupe normalized query |
| AppSetting | persisted user preference/config value | none | canonical settings live in DB |
| Graveyard state | missing-source marker on Capture | derived from capture + media verification | graveyard is a smart section, not a separate collection |
| Duplicate hint | import-time suspicion model | derived from candidate capture comparisons | warning-only in MVP |

### F.2 Capture

Purpose:

- represent an imported screenshot plus SnapBrain metadata

Responsibilities:

- point to the original asset
- hold note, dates, dimensions, file metadata, missing status, and future OCR fields
- act as the root entity for search, reminders, and graveyard behavior

Business rules:

- unsorted means no tags and no note
- missing original means capture appears in graveyard smart view
- deleting a capture deletes only local metadata and related reminder/tag rows

### F.3 Tag

Responsibilities:

- normalize free-form user input into canonical lowercase labels
- support rename, merge, delete, and suggestions

Business rules:

- canonical uniqueness is case-insensitive and whitespace-normalized
- renaming a tag to an existing canonical tag becomes a merge
- deleting a tag removes relationships, not captures

### F.4 Reminder

Responsibilities:

- represent the current reminder for a capture
- track pending, done, and snoozed state
- store notification linkage and reconciliation metadata

Business rules:

- one reminder per capture
- ignored reminder auto-snoozes to same time next day
- marking done completes the reminder without deleting the capture

## G. Database Schema Design

### G.1 General Design Decisions

- Use SQLite as the only canonical persisted store in MVP.
- Store timestamps as `INTEGER` epoch milliseconds UTC.
- Use `TEXT` IDs generated in app code.
- Keep search data denormalized into a dedicated search index table or FTS virtual table.
- Hard-delete Capture rows in MVP on user deletion, but reserve `deleted_at` for future sync/tombstone support.

### G.2 Schema Overview

#### `captures`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT PRIMARY KEY` | app-generated stable ID |
| `media_asset_id` | `TEXT NULL` | primary lookup for media library assets when available |
| `source_uri` | `TEXT NOT NULL` | original stored reference at import time |
| `source_scheme` | `TEXT NOT NULL` | `content`, `file`, `ph`, or other |
| `source_filename` | `TEXT NULL` | filename if available |
| `mime_type` | `TEXT NULL` | if available |
| `imported_at` | `INTEGER NOT NULL` | when metadata record was created |
| `captured_at` | `INTEGER NULL` | original asset timestamp if inferable |
| `file_size` | `INTEGER NULL` | bytes |
| `width` | `INTEGER NULL` | pixels |
| `height` | `INTEGER NULL` | pixels |
| `note` | `TEXT NULL` | max 300 chars at validation layer |
| `note_normalized` | `TEXT NULL` | normalized lowercase copy for non-FTS fallback |
| `is_missing` | `INTEGER NOT NULL DEFAULT 0` | `0` false, `1` true |
| `missing_detected_at` | `INTEGER NULL` | when asset was last confirmed missing |
| `duplicate_group_hint` | `TEXT NULL` | hash/fingerprint group for warning UX |
| `ocr_text` | `TEXT NULL` | future OCR text |
| `ocr_status` | `TEXT NOT NULL DEFAULT 'none'` | `none`, `queued`, `processing`, `ready`, `failed` |
| `ocr_updated_at` | `INTEGER NULL` | future OCR lifecycle |
| `last_viewed_at` | `INTEGER NULL` | detail screen analytics/support for future smart views |
| `updated_at` | `INTEGER NOT NULL` | mutation timestamp |
| `deleted_at` | `INTEGER NULL` | reserved for future sync tombstones |

Indexes:

- `idx_captures_imported_at` on `imported_at DESC`
- `idx_captures_captured_at` on `captured_at DESC`
- `idx_captures_is_missing` on `is_missing, imported_at DESC`
- `idx_captures_media_asset_id` on `media_asset_id`
- `idx_captures_duplicate_group_hint` on `duplicate_group_hint`
- `idx_captures_last_viewed_at` on `last_viewed_at DESC`

Rules:

- no uniqueness on `source_uri`; duplicates must still be importable
- `note` is nullable; empty-string notes should be stored as `NULL`

#### `tags`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT PRIMARY KEY` | stable ID |
| `label` | `TEXT NOT NULL` | stored canonical display label, lowercase after normalization |
| `canonical_label` | `TEXT NOT NULL` | same as label in MVP, retained for future richer display rules |
| `created_at` | `INTEGER NOT NULL` | created timestamp |
| `updated_at` | `INTEGER NOT NULL` | updated timestamp |
| `last_used_at` | `INTEGER NULL` | optional suggestion ranking |

Indexes and constraints:

- unique index on `canonical_label`
- `idx_tags_last_used_at` on `last_used_at DESC`

Normalization strategy:

- trim outer whitespace
- Unicode normalize to NFKC
- lowercase
- collapse inner whitespace runs to single spaces
- preserve emoji and symbols

Examples:

- `" Receipts "` -> `receipts`
- `"C++"` -> `c++`
- `"🔥 Deals"` -> `🔥 deals`

#### `capture_tags`

| Column | Type | Notes |
| --- | --- | --- |
| `capture_id` | `TEXT NOT NULL` | FK to `captures.id` |
| `tag_id` | `TEXT NOT NULL` | FK to `tags.id` |
| `applied_at` | `INTEGER NOT NULL` | join timestamp |

PK and indexes:

- primary key `(capture_id, tag_id)`
- `idx_capture_tags_tag_id_capture_id` on `(tag_id, capture_id)`

FK behavior:

- `ON DELETE CASCADE` from `captures`
- `ON DELETE CASCADE` from `tags`

#### `reminders`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT PRIMARY KEY` | stable reminder ID |
| `capture_id` | `TEXT NOT NULL UNIQUE` | one reminder per capture |
| `status` | `TEXT NOT NULL` | `pending`, `done`, `cancelled` |
| `due_at` | `INTEGER NOT NULL` | next due instant in UTC epoch ms |
| `local_date` | `TEXT NOT NULL` | `YYYY-MM-DD` chosen by user |
| `local_time` | `TEXT NOT NULL` | `HH:mm` chosen by user |
| `timezone` | `TEXT NOT NULL` | IANA timezone snapshot |
| `notification_id` | `TEXT NULL` | local notification identifier |
| `last_notified_at` | `INTEGER NULL` | when notification fired or was observed |
| `last_interaction_at` | `INTEGER NULL` | done/snooze/open interaction timestamp |
| `completed_at` | `INTEGER NULL` | set when marked done |
| `auto_snooze_count` | `INTEGER NOT NULL DEFAULT 0` | ignored reminder recovery counter |
| `created_at` | `INTEGER NOT NULL` | created timestamp |
| `updated_at` | `INTEGER NOT NULL` | updated timestamp |

Indexes:

- `idx_reminders_status_due_at` on `(status, due_at ASC)`
- `idx_reminders_capture_id` on `capture_id`

#### `recent_searches`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `TEXT PRIMARY KEY` | stable ID or hash |
| `query_text` | `TEXT NOT NULL` | original user query |
| `normalized_query` | `TEXT NOT NULL` | normalized form |
| `filter_snapshot` | `TEXT NULL` | JSON string for future saved filter parity |
| `last_used_at` | `INTEGER NOT NULL` | recency ranking |
| `use_count` | `INTEGER NOT NULL DEFAULT 1` | popularity ranking |

Indexes and rules:

- unique index on `(normalized_query, COALESCE(filter_snapshot, ''))`
- prune to last 20 entries in MVP

#### `settings`

| Column | Type | Notes |
| --- | --- | --- |
| `key` | `TEXT PRIMARY KEY` | setting identifier |
| `value_json` | `TEXT NOT NULL` | JSON-encoded typed value |
| `updated_at` | `INTEGER NOT NULL` | mutation time |

Suggested keys:

- `library.defaultViewMode`
- `library.lastViewMode`
- `notifications.enabled`
- `notifications.channelConfigured`
- `onboarding.completed`
- `onboarding.lastSeenVersion`
- `diagnostics.lastGraveyardScanAt`
- `backup.lastExportAt`
- `backup.lastExportPath`
- `ocr.infoDismissed`

#### `sync_meta` optional future table

| Column | Type | Notes |
| --- | --- | --- |
| `key` | `TEXT PRIMARY KEY` | metadata key |
| `value_json` | `TEXT NOT NULL` | JSON value |
| `updated_at` | `INTEGER NOT NULL` | timestamp |

Use only when sync/export metadata becomes more complex.

#### `capture_search`

Recommended now:

- create a dedicated search index structure rather than searching directly across normalized tables every keystroke

Preferred implementation:

- `capture_search` FTS5 virtual table with one row per Capture

Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `capture_id` | `TEXT UNINDEXED` | references `captures.id` |
| `tags_text` | `TEXT` | space-joined canonical tags |
| `note_text` | `TEXT` | normalized note |
| `ocr_text` | `TEXT` | future OCR text |
| `combined_text` | `TEXT` | optional denormalized union for simpler query ranking |

Fallback if FTS is deferred:

- regular table with same columns plus normalized token cache; repository can use `LIKE` for MVP and migrate later

### G.3 Tag Uniqueness

- UI accepts any text up to a reasonable tag length limit, for example 40 characters.
- Before persistence, normalize to canonical lowercase form.
- If canonical tag exists, reuse it.
- If tag rename produces an existing canonical label, merge the tags and deduplicate join rows.

### G.4 Graveyard vs Delete

- Graveyard is not soft-delete.
- Graveyard means the Capture still exists in the library database but `is_missing = 1`.
- User deletion removes local metadata rows from `captures`, `capture_tags`, `reminders`, and search index.
- `deleted_at` exists only as a reserved future field for sync/export reconciliation.

### G.5 Migration Strategy

- Maintain numbered SQL or TS migration files.
- Store current schema version in `PRAGMA user_version`.
- Run migrations at app startup before route mounting.
- Each migration should run inside a transaction.
- Search index migrations must include rebuild steps.
- Failed migration should halt app boot into a recoverable error screen with export instructions if possible.

## H. Query and Repository Design

### H.1 Repository Boundaries

| Repository | Responsibilities |
| --- | --- |
| `CaptureRepository` | capture CRUD, feed queries, detail query, missing-state updates |
| `TagRepository` | tag upsert, rename, merge, delete, usage counts, suggestions |
| `ReminderRepository` | reminder CRUD, upcoming/overdue/completed queries |
| `SearchRepository` | live search queries, recent searches, search index reads |
| `SettingsRepository` | typed settings get/set |
| `GraveyardRepository` or service over capture repo | graveyard listing, relink updates, permanent delete |
| `ImportRepository` | batch insert helpers within transaction |

### H.2 Domain Services

| Service | Responsibilities |
| --- | --- |
| `CaptureService` | create/update capture metadata, delete capture cleanly |
| `TagService` | normalize tags, merge tags, apply tag sets to captures |
| `ImportService` | orchestrate import pipeline transaction |
| `DuplicateService` | score candidate duplicates during import |
| `ReminderService` | create/update reminders, mark done, snooze, reconcile |
| `ReminderScheduler` | schedule/cancel local notifications |
| `SearchIndexer` | rebuild or incrementally update `capture_search` |
| `GraveyardService` | verify asset existence lazily, relink assets, move to graveyard |
| `BackupService` | export SQLite and metadata manifest |

### H.3 UI-Facing Derived Data

Compute on demand:

- unsorted status in list queries via `note IS NULL` and join counts
- tag counts in Tags screen
- reminder badges from joined reminder state
- smart view counts

Persist:

- canonical capture records
- recent searches
- settings
- search index documents
- reminder notification identifiers

Memoize in memory only at hook level:

- mapped list rows/cards
- grouped reminder sections
- tag suggestion filtering for current input

Do not persist:

- current Search screen text input
- temporary filter sheet selections before apply
- import draft selections after save/cancel

### H.4 Indexed Queries That Matter

Must be optimized:

- Library feed sorted by `imported_at DESC`
- graveyard feed filtered by `is_missing = 1`
- reminder feed by `status, due_at`
- tag detail feed by `tag_id`
- duplicate lookup on `media_asset_id`, `source_uri`, and heuristic fingerprint columns
- recent searches ordered by `last_used_at DESC`

### H.5 Query Strategy Notes

- Screens should request only the fields they need for the current layout.
- Grid queries should avoid loading full note text when note preview is not shown.
- Detail query can fetch full metadata, joined tags, and reminder state in one targeted query.
- Search queries should return paginated result sets even in MVP to avoid huge UI updates.

## I. Import Pipeline Architecture

### I.1 Import Flow Stages

1. User taps FAB.
2. App opens custom import picker backed by `expo-media-library`.
3. User selects multiple screenshots.
4. App resolves asset metadata for selected items.
5. Duplicate heuristics run against existing captures.
6. User proceeds to review sheet.
7. User applies batch metadata:
   - tags-to-all
   - optional reminder-to-all
   - per-item deselection
   - optional per-item note editing if provided later
8. App saves all accepted captures in one transaction.
9. Search index and reminders are updated.
10. Domain change event invalidates Library/Search/Tags/Reminders queries.

### I.2 Data Read During Import

Read from media layer when available:

- `asset.id`
- `asset.uri`
- `asset.filename`
- `asset.creationTime`
- `asset.mediaType`
- dimensions
- file size
- album/screenshot hints if available

Persist locally:

- `media_asset_id`
- `source_uri`
- source metadata and timestamps
- normalized tags
- note
- reminder
- duplicate hint/fingerprint

### I.3 Picker Design

Recommended approach:

- custom picker screen using `expo-media-library.getAssetsAsync`
- filter to images and sort newest first
- optionally bias to screenshot album or screenshot-like filenames when detectable, but do not hard-restrict in MVP

Why:

- supports true multi-select
- retains asset IDs for future verification and relink
- allows SnapBrain-specific review UX instead of a generic system picker

### I.4 Import Draft Model

Use a dedicated import draft store:

- selected assets
- per-asset preview metadata
- duplicate hints
- shared tags draft
- shared reminder draft
- deselected asset IDs

This state is ephemeral and should be cleared on successful save or explicit discard.

### I.5 Save Transaction

Pseudo-flow:

```text
begin transaction
  for each selected asset:
    normalize note/tags
    upsert tags
    insert capture
    insert capture_tags
    insert reminder if provided
    upsert capture_search document
commit
after commit:
  schedule reminders
  emit domain changes
```

Scheduling notifications after commit avoids DB rows referencing reminders that never persisted.

### I.6 Failure Handling

| Failure | Handling |
| --- | --- |
| Permission denied | block picker, show rationale and open settings path |
| Asset metadata unavailable | allow import with minimal fields if URI exists; otherwise block that asset |
| Asset disappears before save | mark item failed, keep rest importable, surface partial failure summary |
| Duplicate suspicion | warn only; user can keep all or deselect suspected duplicates |
| Batch save failure | rollback transaction, preserve draft in memory until user dismisses |

## J. Duplicate Detection Strategy

### J.1 MVP Principle

Duplicate handling should be warning-based, not destructive and not blocking. The user decides whether to keep or remove suspected duplicates during import.

### J.2 Heuristic Levels

| Confidence | Rule |
| --- | --- |
| High | exact `media_asset_id` match |
| High | exact `source_uri` match |
| Medium | same filename + file size + near-identical created timestamp |
| Medium | same file size + dimensions + created timestamp bucket |
| Low | same normalized filename stem + similar timestamp |

### J.3 When It Runs

- after asset metadata resolution
- before review save confirmation
- optionally rechecked again just before final transaction for long-running import sessions

### J.4 Stored Hint

Persist `duplicate_group_hint` as a lightweight fingerprint, for example:

```text
lower(filename)|file_size|width|height|captured_at_minute_bucket
```

This is not authoritative. It only supports future UI like "possible duplicate cluster".

### J.5 Future Upgrade Path

Later improvements:

- image perceptual hash
- OCR-aware similarity
- capture clustering view
- similarity scoring across existing captures

None of that should block MVP import flow.

## K. Search Architecture

### K.1 Search Scope

MVP search covers:

- tags
- note text

Filters:

- unsorted
- reminder
- graveyard
- date range

Also required:

- live/instant results
- recent searches

### K.2 Chosen Approach

Use a dedicated search index structure with one document per Capture.

Recommended now:

- `capture_search` FTS table if verified in the target Expo SQLite build

Fallback:

- regular denormalized `capture_search` table with normalized text columns and `LIKE`-based queries

Either way, keep search indexing isolated behind `SearchIndexer`.

### K.3 Search Document Shape

Search document should include:

- `capture_id`
- canonical tag text joined as one string
- normalized note text
- future OCR text field
- combined text for ranking

Do not search directly against many-to-many joins on every keystroke.

### K.4 Live Query Behavior

- Search screen input updates local state immediately.
- Query execution can be immediate for short datasets, but use a small debounce of 80 to 120 ms to avoid unnecessary work on Android while typing quickly.
- Search results default to list mode.
- Empty query shows recent searches and suggested smart filters, not the full library feed.

### K.5 Matching Behavior

Recommended MVP behavior:

- tokenize normalized input on whitespace
- AND semantics across tokens
- prefix matching within tokens where supported by the search backend
- filters applied after or alongside text match

This yields predictable results and keeps ranking simple.

### K.6 Sorting and Ranking

Default ranking:

1. exact tag match
2. prefix tag match
3. note text match
4. most recently imported tie-break

When query is empty and filters are present:

- sort by `imported_at DESC` unless filter implies reminder chronology

### K.7 Library vs Search Differences

| Surface | Behavior |
| --- | --- |
| Library | browse-first, smart views on top, grid default, filter sheet optional |
| Search | query-first, list default, recent searches, search-specific ranking |

### K.8 Recent Searches

- save only when user submits, taps a result, or leaves a non-empty query after interaction
- prune to last 20
- dedupe on normalized query + filter snapshot

### K.9 OCR Readiness

Prepare now:

- `ocr_text`, `ocr_status`, `ocr_updated_at` fields
- search index field for OCR text
- `SearchIndexer.rebuildCaptureDocument(captureId)` that already accepts OCR input when it exists

Do not ship OCR processing in MVP.

## L. Smart Views and Derived Data

### L.1 Required Smart Views

| Smart view | Logic | Query-based or cached |
| --- | --- | --- |
| Recently Added | captures ordered by `imported_at DESC` | query-based |
| Unsorted | captures with no tags and no note | query-based |
| Most Used Tags | tags ordered by capture count desc | query-based aggregate |
| Reminder Pending / Upcoming | `reminders.status = 'pending'` ordered by `due_at ASC` | query-based |
| Graveyard | captures where `is_missing = 1` | query-based |

### L.2 Unsorted Logic

Exact MVP rule:

- `note IS NULL` and no rows in `capture_tags` for the capture

Whitespace-only notes should be normalized to `NULL`, not stored as empty strings.

### L.3 Library Top Section

Recommended top section:

- horizontal smart-view rail with counts
- recently added is just the default feed, so the card acts as a quick jump/label rather than a separate storage concept
- graveyard card should show count and warning styling

### L.4 Count Strategy

- compute counts with indexed aggregate queries
- memoize results per screen render cycle
- do not precompute persistent counters in MVP

For 5k to 10k captures, indexed aggregates remain acceptable and are simpler than maintaining counter caches.

## M. Reminder and Notification Architecture

### M.1 Reminder Model

One reminder per Capture. The `reminders` table stores both business state and the scheduling link to the local notification.

### M.2 Reminder Actions

- create reminder
- reschedule reminder
- snooze reminder
- mark done
- clear reminder

### M.3 Notification Scheduling

Flow:

1. user picks date + time
2. reminder row is persisted with `status = pending`
3. scheduler requests notification permission if needed
4. app schedules a local notification and stores `notification_id`
5. if scheduling fails, reminder remains in DB and UI shows "notification not scheduled" state until retried

### M.4 Ignored Reminder Auto-Snooze

Rule:

- if a pending reminder has passed and there is no done/snooze interaction, it should move to the same local time on the next day

Implementation:

- app runs reminder reconciliation on launch, foreground, and Reminders tab focus
- query pending reminders where `due_at < now`
- for each reminder not marked done:
  - if already interacted with after last due time, leave it
  - otherwise compute next local day using stored `local_time` and current device timezone
  - update `due_at`, `local_date`, `timezone`, `auto_snooze_count`
  - cancel old `notification_id`
  - schedule a new notification

### M.5 Overdue Logic

If notification delivery is delayed or permissions are off:

- reminder still appears as overdue based on DB `due_at`
- Reminders screen can show sections:
  - overdue
  - today/upcoming
  - done

This makes reminders usable even when OS scheduling is imperfect.

### M.6 App Launch Reconciliation

Run `ReminderService.reconcile()` on:

- cold launch after migrations
- app foreground
- notification response open
- Settings notification-permission screen return

This protects against missed schedules, reboot behavior, and permission changes.

### M.7 Permission-Off Behavior

If notifications are disabled:

- allow reminder creation anyway
- persist reminder in DB
- show inline warning that system notifications are off
- show reminder inside Reminders tab and on Capture detail
- offer "enable notifications" CTA

### M.8 Expo Managed Constraints

Honest constraints:

- local scheduled notifications are supported in Expo
- Android notification behavior can still vary by OEM and exact-alarm policy
- reminders therefore need DB-backed overdue and reconciliation logic, not blind trust in the scheduler

## N. Missing Original and Graveyard Architecture

### N.1 Principle

Graveyard is a smart state inside the Library, not a separate storage silo. A Capture enters graveyard when SnapBrain can no longer resolve the original source image.

### N.2 What to Store for Verification

Store both when possible:

- `media_asset_id` for media-library lookups
- `source_uri` as last known reference

`media_asset_id` should be the primary verification handle because URIs can change.

### N.3 When Missing Detection Runs

Do not run existence checks during normal list rendering.

Run checks:

- when opening Capture detail if the thumbnail/image fails to resolve
- during a lightweight background diagnostic pass triggered manually from Settings
- on app foreground for a small sampled subset, not the whole library
- before fullscreen preview if necessary

### N.4 Verification Strategy

Order:

1. if `media_asset_id` exists, ask media gateway for asset info
2. if no asset ID and URI is `file://`, verify with filesystem info
3. if URI is unverifiable but image load fails repeatedly, mark as suspected missing and request explicit user verification

### N.5 Graveyard State Transition

Pseudo-flow:

```text
verify capture source
  if found:
    if capture.is_missing:
      clear missing flags
  else:
    set is_missing = 1
    set missing_detected_at = now
    cancel active reminder notification if desired? no
```

Capture remains searchable and editable in graveyard unless the user permanently deletes it.

### N.6 Graveyard UI Behavior

- show placeholder thumbnail
- retain tags, note, metadata, and reminder badges
- detail screen should show missing-state banner with relink and delete actions
- search results can include graveyard items when filter permits
- graveyard filter must be explicit in Search and visible in Library smart views

### N.7 Relink Flow

Recommended relink flow:

1. user opens missing capture
2. taps relink
3. app opens import/relink asset picker
4. selected asset metadata is shown for confirmation
5. app updates `media_asset_id`, `source_uri`, dimensions/file info if changed
6. clear `is_missing` and `missing_detected_at`

Do not create a new Capture during relink.

### N.8 Permanent Delete

Permanent delete from graveyard:

- removes SnapBrain metadata only
- does not attempt to delete original media because the original is already unavailable or may not be owned by the app

## O. State Management Architecture

### O.1 State Split

| State type | Where it lives |
| --- | --- |
| Captures, tags, reminders, searches, settings | SQLite |
| Import draft selections and shared metadata | Zustand ephemeral store |
| Search input text and draft filters | local state or lightweight store scoped to Search feature |
| Navigation state | Expo Router / React Navigation |
| Temporary modal visibility | route state or local component state |
| Theme constants | static modules |

### O.2 Recommendation

Use Zustand only for:

- `importDraft.store`
- `search.store` for non-persisted current query/filter draft
- `ui.store` for transient banners, selection mode, and local screen UX
- `domainEvents.store` or event bus for lightweight repository invalidation

Do not mirror DB entities into Zustand collections.

### O.3 Avoiding Stale Data

- DB is always source of truth for captures/tags/reminders.
- Mutations go through services, then emit domain-change events.
- Feature hooks subscribe to relevant domain version counters and re-run repository queries.
- Route params only pass IDs and lightweight context, never full entity objects.

### O.4 Avoiding Re-render Storms

- keep list item components pure and prop-light
- have feature hooks return already-shaped row models
- isolate view mode, selected IDs, and query text from the actual feed data
- avoid storing full large arrays in global state when a repository query can derive them

## P. UI Composition Strategy

### P.1 Composition Levels

| Level | Role |
| --- | --- |
| Primitives | typography, buttons, icons, layout shells |
| Shared components | tag chips, reminder badges, thumbnails, empty states |
| Feature components | library cards, reminder rows, import review sections |
| Screen containers | route-connected screens, data fetching, event handlers |
| Hooks/view models | transform repo results into stable UI props |

### P.2 Key Reusable Components

- `CaptureThumbnail`
- `MissingThumbnail`
- `TagChip`
- `ReminderBadge`
- `CaptureMetadataSection`
- `EmptyState`
- `SmartSectionCard`
- `DuplicateWarningCard`

### P.3 Grid vs List Separation

- use separate components for `LibraryGridCard` and `LibraryListRow`
- share thumbnail and badge subcomponents
- do not build one polymorphic item component with many branches; it becomes slow and hard to maintain

### P.4 Screen Container Pattern

Each major screen should follow:

1. route wrapper gets params
2. feature hook loads data and commands
3. screen component renders layout and subcomponents

This keeps UI testable and prevents repositories from leaking into the route layer.

## Q. Performance Strategy

### Q.1 Rendering Strategy for 5k to 10k Captures

- use FlashList for Library, Search results, Reminders, and Tags if result counts are large
- use stable `keyExtractor` with capture/tag IDs
- separate grid and list feeds to avoid layout thrash
- only request columns needed for the active layout

### Q.2 Thumbnail Strategy

- use `expo-image`
- render small thumbnails in Library/Search
- avoid loading full-resolution assets in grid/list
- keep card heights predictable
- only detail and fullscreen preview should request larger images

### Q.3 Query Strategy

- index feed and filter columns
- use dedicated search index, not ad hoc join-heavy live search
- paginate result sets
- wrap batch imports in one transaction
- avoid N+1 tag queries by joining or pre-aggregating tag snippets per feed query

### Q.4 Import Performance

- batch writes inside a single transaction
- pre-normalize tags once per batch
- upsert shared tags once, reuse IDs across all selected captures
- delay notification scheduling until after commit
- update search index incrementally per inserted capture inside the same transaction if practical

### Q.5 List Item Performance

- avoid expensive inline formatting in `renderItem`
- preformat display strings in feature hooks
- avoid nested FlashLists for every section where a simple mapped header is enough
- use `getItemType` when rows can vary significantly

### Q.6 Search Performance

- small debounce avoids hammering SQLite on every keystroke
- query only first page of results initially
- ranking must remain simple in MVP
- keep OCR out of live search until OCR exists

### Q.7 Tag Screen Scale

For many tags:

- query tag counts with aggregate SQL
- sort by usage then alphabetically
- support incremental search within Tags screen
- avoid computing capture counts in JS

### Q.8 Missing-File Performance

- never verify all assets during list scroll
- lazy verification on detail/open/error paths only
- manual diagnostics scan from Settings can be chunked

### Q.9 Route Performance

- do not preload detail metadata for every visible card
- open detail by ID and fetch targeted data there
- keep modal routes lightweight and draft-based

## R. Settings, Preferences, and Backup Architecture

### R.1 Settings Categories

Required settings:

- default view mode
- last chosen library view mode
- notification preferences/help state
- onboarding replay/completion
- app info/about
- storage diagnostics
- graveyard management
- OCR placeholder/info section
- backup/export

### R.2 Preference Storage

Canonical approach:

- store user-visible settings in the SQLite `settings` table

Reason:

- one exportable source of truth
- no mismatch between backup and runtime state
- easier restore story later

### R.3 Backup Design

MVP backup should be described honestly as metadata-first.

Export contents:

- SQLite database file
- optional small JSON manifest with:
  - app version
  - schema version
  - export time
  - warning that original screenshot assets are not included

Implementation:

1. checkpoint/close DB safely if needed
2. copy database file to app cache/export folder
3. write manifest JSON
4. share or save with `expo-sharing`

### R.4 Restore Expectations

If restore is added later:

- metadata can be restored
- original screenshots will not come with the export
- restored captures may enter graveyard until relinked

Do not market MVP export as a full backup of screenshots.

### R.5 Diagnostics

Storage diagnostics screen should show:

- capture count
- graveyard count
- reminders count
- approximate DB file size
- last graveyard scan time
- last export time

## S. Error Handling and Edge Cases

### S.1 Recoverability Principles

- preserve drafts when possible
- keep partial user input visible after failures
- prefer item-level failure over whole-flow loss for imports
- keep DB state consistent through transactions

### S.2 Edge Cases

| Case | Architecture response |
| --- | --- |
| Permission denied for media | show gate screen, retry, offer OS settings deep link |
| Image URI invalid | mark capture suspect, verify through media gateway, move to graveyard if confirmed |
| Original file missing | set `is_missing = 1`, expose relink and delete options |
| Reminder permission denied | persist reminder anyway, show unscheduled state |
| Duplicate ambiguity | show non-blocking warning with confidence explanation |
| Failed batch save | rollback transaction, preserve import draft in memory |
| Partial import failure | save successful items, report failed items explicitly only if transaction policy allows per-item fallback; otherwise rollback all |
| Relink failure | keep capture in graveyard and preserve current metadata |
| DB migration failure | stop app boot into migration error screen; offer export/log guidance if accessible |
| Malformed tag input | normalize and reject empty canonical tags |
| Oversized note input | enforce 300-char cap in UI and validation layer |
| Timezone reminder issues | store UTC due time plus local date/time/timezone; reconcile on launch |

### S.3 Partial Import Policy

Recommendation:

- use all-or-nothing transaction for final save

Reason:

- simpler consistency
- easier reasoning for reminders and search index

If individual asset metadata resolution fails before save, remove those assets from the final transaction and show them as failed candidates.

## T. Testing Strategy

### T.1 Priorities

Highest-risk logic:

1. tag normalization and merge rules
2. reminder scheduling/reconciliation
3. import transaction behavior
4. search/filter correctness
5. graveyard transitions and relink

### T.2 Test Layers

| Layer | What to test |
| --- | --- |
| Unit | normalization, duplicate scoring, unsorted logic, reminder date math |
| Repository integration | SQLite queries, indexes assumed by logic, migrations |
| Service tests | import orchestration, tag merge, reminder reconcile, graveyard relink |
| Component tests | search screen empty/results states, import review sheet, reminder row actions |
| E2E | import -> detail -> search -> reminder -> graveyard critical path |

### T.3 Concrete Test Targets

- `normalizeTag(" Receipts ") -> "receipts"`
- renaming `travel` to `Travel` no-op merge-safe behavior
- renaming `travel` to existing `shopping` merges join rows correctly
- unsorted query excludes any capture with a non-empty note or at least one tag
- import batch with shared tags writes correct `capture_tags`
- duplicate scoring returns expected confidence tiers
- reminder reconcile auto-snoozes ignored reminders to next day same local time
- completed reminder is not auto-snoozed
- graveyard transition occurs when media gateway returns not found
- relink clears `is_missing` and updates source references
- recent search pruning keeps only newest 20

### T.4 Tooling

- `jest-expo` for unit and module tests
- temporary SQLite DB per repository test suite
- `@testing-library/react-native` for screens/components
- Maestro for end-to-end flows on Android development builds

## U. Implementation Plan

### Phase 0. Project Setup

Goals:

- create Expo TypeScript app shell
- enable Expo Router
- set up theme, linting, formatting, test harness
- configure CNG/plugins for media, notifications, SQLite

Dependencies:

- none

Deliverables:

- bootable app with tab shell
- root providers
- migration runner stub
- theme primitives

Risks:

- notification/media config drift between dev and production builds

### Phase 1. Schema, DB, and Repositories

Goals:

- implement initial schema and migrations
- build repository interfaces and DB client
- add settings seed/defaults

Dependencies:

- Phase 0

Deliverables:

- migrations `0001_initial`, `0002_capture_search`
- typed repositories
- repository test coverage

Risks:

- schema churn if product rules are not respected up front

### Phase 2. Library and Basic Capture Display

Goals:

- implement Library tab
- support grid/list mode
- remember last chosen view
- render capture thumbnails and badges

Dependencies:

- Phase 1

Deliverables:

- Library feed query
- grid/list components
- smart views rail

Risks:

- premature over-fetching of metadata hurting scroll performance

### Phase 3. Import Flow and Duplicate Warnings

Goals:

- custom multi-select import picker
- metadata resolution
- duplicate warning UX
- quick metadata review sheet

Dependencies:

- Phase 2

Deliverables:

- import draft store
- import service transaction
- tags-to-all and reminder-to-all

Risks:

- media permission edge cases
- asset metadata inconsistencies across devices

### Phase 4. Tags, Notes, and Detail Editing

Goals:

- capture detail screen
- inline note/tag editing
- tag rename/merge/delete flows

Dependencies:

- Phase 3

Deliverables:

- Capture detail route
- Tags tab
- tag service merge logic

Risks:

- keeping search index and tag counts consistent after tag edits

### Phase 5. Search and Filters

Goals:

- live search
- recent searches
- filter sheet
- tag-detail filtered results

Dependencies:

- Phase 4

Deliverables:

- search indexer
- Search screen
- Search repository and tests

Risks:

- search ranking/performance tuning on low-end Android

### Phase 6. Reminders and Notifications

Goals:

- reminder CRUD
- reminders tab
- local notification scheduling and response handling
- overdue reconciliation

Dependencies:

- Phase 4

Deliverables:

- reminder service/scheduler
- permission-aware reminder UX
- reminder tests

Risks:

- platform-specific scheduling accuracy

### Phase 7. Graveyard and Relink

Goals:

- missing-source detection
- graveyard smart view/filter
- relink flow
- permanent delete

Dependencies:

- Phase 4

Deliverables:

- graveyard service
- placeholder thumbnail behavior
- relink modal

Risks:

- unreliable verification for non-asset URIs

### Phase 8. Settings, Export, and Diagnostics

Goals:

- settings screens
- metadata export
- diagnostics panel
- onboarding replay

Dependencies:

- Phase 1

Deliverables:

- backup service
- storage diagnostics
- honest backup copy and warnings

Risks:

- file export UX differences across Android versions

### Phase 9. Performance Pass and Hardening

Goals:

- measure list performance
- optimize queries and render paths
- expand tests
- stabilize edge cases

Dependencies:

- all earlier feature phases

Deliverables:

- performance baselines
- final query/index review
- E2E critical-path suite

Risks:

- hidden N+1 queries
- oversized row models causing re-renders

## V. Future Extensibility Plan

### V.1 What Should Exist Now

- clean repository/service boundaries
- search index abstraction
- media gateway abstraction
- reminder scheduler abstraction
- future-ready OCR columns
- `deleted_at` and optional `sync_meta` placeholders

### V.2 What Should Be Deferred

- OCR engine integration
- cloud sync protocol
- auth/account layer
- auto-import listener
- perceptual hash duplicate engine
- AI tagging pipeline

### V.3 Extension Paths

| Future feature | What this architecture already supports | What to add later |
| --- | --- | --- |
| OCR with ML Kit | `ocr_text`, `ocr_status`, search index hooks | OCR worker/adapter, queue, reindex jobs |
| Full-text search | dedicated search index layer | richer ranking, fuzzy matching, OCR field weighting |
| Collections / saved filters | recent search/filter snapshot model | `saved_filters` table and UI |
| Auto-import | media gateway abstraction | screenshot watcher/import suggestion queue |
| Cloud sync | DB source of truth and future tombstone field | sync tables, conflict resolution, account storage |
| Stronger duplicate detection | duplicate service and hint field | perceptual hashing and clustering |
| AI tag suggestions | clean metadata service boundaries | inference adapter and suggestion review UX |

### V.4 Anti-Overengineering Rule

Do not add:

- generic plugin architecture
- background job engine
- sync event log
- collection hierarchy
- OCR queues

until the product actually needs them.

## W. Handoff Summary for AI Coding Agents

Build in this order:

1. database client, migrations, repositories
2. core domain services: tag normalization, import, search indexing, reminders, graveyard
3. tab shell and Library feed
4. import flow
5. detail editing, Tags, Search, Reminders, Settings

Source of truth:

- SQLite owns captures, tags, reminders, settings, recent searches, and graveyard state
- Zustand owns only ephemeral UI workflow state

Important data contracts:

- `Capture` must always retain `source_uri`; store `media_asset_id` whenever available
- tags are always normalized before persistence
- empty note becomes `NULL`
- one reminder per capture
- graveyard is `is_missing = 1`, not deletion
- search reads from a dedicated index abstraction, not direct UI-side joins

Avoid coupling:

- do not let screens call SQLite directly
- do not let Expo media/notification modules leak outside their adapters
- do not duplicate capture lists in global state

Performance mistakes to avoid:

- searching raw joined tables on every keystroke
- verifying asset existence while scrolling
- loading full image assets into grid cards
- storing full entity arrays in Zustand
- doing per-item tag queries in JS

Implementation bias:

- prefer simple, explicit repositories and services over generic frameworks
- keep MVP folderless
- keep backup language honest: metadata-first, not asset backup
- leave OCR and sync planned but unimplemented
