# SnapBrain Product Specification

## 1. Executive Product Overview

### 1.1 Product Summary
SnapBrain is an offline-first mobile application for turning screenshots into structured personal knowledge captures. A user manually imports screenshots from the device gallery, enriches them with lightweight metadata inside the app, and later retrieves them through tags, notes, reminders, smart views, and search.

SnapBrain is not a photo gallery replacement. It is a screenshot-centric second-brain layer that sits on top of the user's existing photo library.

### 1.2 Problem Statement
People accumulate screenshots faster than they can organize them. Screenshots are commonly used to preserve temporary or semi-valuable information such as:

- study slides
- messages
- receipts
- shopping references
- inspiration
- social posts
- travel ideas
- to-do prompts
- quick notes

In the standard photo gallery, these screenshots become difficult to browse, search, and revisit. Gallery apps optimize for visual chronology, not retrieval by meaning or intent.

### 1.3 Solution Statement
SnapBrain solves screenshot overload by converting screenshots into **Captures**: structured metadata records linked to original image files. Users manually choose screenshots worth keeping, add lightweight organizational metadata, and retrieve them later through a fast local system designed for search and recall.

### 1.4 Target Users
Primary audiences:

- students saving lecture slides, assignment instructions, timetables, or learning references
- young adults saving shopping references, travel ideas, event info, recipes, or chat screenshots
- general users who need a better place for temporary visual references than the gallery
- knowledge hoarders and personal knowledge users who save information aggressively and need later retrieval

### 1.5 Value Proposition
SnapBrain offers:

- faster recall than a gallery
- lower friction than full note-taking apps
- stronger privacy than cloud-dependent knowledge products
- enough structure to stay useful without becoming heavy document management

### 1.6 Why Offline-First Matters
Offline-first is central to the product, not a deployment detail.

- Screenshots often contain personal, financial, educational, or sensitive information.
- Users need reliable access without network dependency.
- Metadata operations such as search, tagging, and reminders should feel instant.
- The app must preserve utility in poor connectivity, travel, or low-trust contexts.
- The product promise is local control first, optional cloud later.

### 1.7 Why Screenshots Need a Second-Brain Model
Screenshots are not just images. They are memory fragments, future reminders, and saved context. A gallery treats them as camera-roll artifacts. SnapBrain treats them as intentional captures with:

- semantic organization
- lightweight annotation
- retrieval workflows
- reminder workflows
- missing-source handling

That shift from "image" to "Capture" is the core product model.

## 2. Product Scope Definition

### 2.1 Scope Positioning
SnapBrain MVP is intentionally constrained. It should solve screenshot retrieval and lightweight organization cleanly before adding automation, OCR, or cloud features.

### 2.2 Scope Table

| Area | MVP | Phase 1.5 | Future Scope |
| --- | --- | --- | --- |
| Organization model | Global Library, tag-first, folderless | Better filters and sorting polish | Collections and saved filters |
| Import | Manual import from media picker only | Import flow refinements | Optional auto-import detection |
| Search | Live search across tags and note text | Better ranking and fuzzy matching | OCR-backed full-text search |
| Metadata | Tags, note, reminder, status flags | Better edit workflows | Richer metadata templates |
| Reminders | One reminder per Capture | Smarter reminder UX | Advanced recurring logic |
| Duplicates | Heuristic warning only | Stronger duplicate hints | Image hash and semantic duplicate detection |
| Backup | SQLite export, metadata-first | Better import guidance | Full restore with assets and sync |
| Missing originals | Graveyard, relink, permanent delete | Better diagnostics | Optional asset copy / cloud preservation |
| Design system | Light mode only | More motion polish | Theme expansion if product warrants it |
| OCR | Not shipped | Placeholder hooks only | On-device OCR with ML Kit |

### 2.3 MVP Scope
Included in MVP:

- folderless global Library
- manual multi-select screenshot import
- quick metadata sheet during import
- free-text tags with suggestions and normalization
- optional note per Capture with 300 character limit
- one reminder per Capture
- instant search across tags and note text
- recent searches
- smart views
- grid and list views
- duplicate warning during import
- capture detail view with inline editing
- graveyard for missing originals
- SQLite metadata export
- onboarding
- settings

Explicit MVP decisions:

- folders are removed from MVP
- organization is tag-first
- Captures live in a single global Library
- OCR is not MVP
- collections and saved filters are not MVP
- app stores file reference plus metadata, not duplicated image files

### 2.4 Phase 1.5 Improvements
Phase 1.5 can strengthen the MVP without changing the core model:

- improved duplicate heuristics
- faster tag suggestion UX
- better search ranking and typo tolerance
- bulk actions from Library selection mode
- richer storage diagnostics
- more refined reminder handling
- backup import validation and restore warnings

### 2.5 Future Scope
Future scope may include:

- on-device OCR with searchable `ocr_text`
- saved searches and collections
- optional auto-import of detected screenshots
- cloud backup and sync
- OAuth sign-in for optional account features
- copied asset backup for true cross-device restore
- stronger duplicate clustering
- AI-assisted tagging or summarization

### 2.6 Scope Guardrails
The following must not creep into MVP:

- folder hierarchy
- cloud-first assumptions
- mandatory account system
- automatic screenshot ingestion
- full document-management complexity
- multi-reminder logic per Capture
- title fields or heavy form entry

## 3. User Types and Primary Use Cases

### 3.1 User Groups

#### 3.1.1 Students
Needs:

- save lecture slides and assignment instructions
- tag by course or topic
- search later by keyword or tag
- add reminder for exam, deadline, or revision

Pain points solved:

- screenshots disappear into the camera roll
- lecture screenshots are hard to browse chronologically

#### 3.1.2 Young Adults
Needs:

- save shopping references, apartment ideas, memes, recipes, event details, travel plans
- set reminders for tickets, deadlines, or purchase follow-ups
- retrieve screenshots quickly later

Pain points solved:

- temporary screenshots become permanent clutter
- useful images are forgotten because recall is poor

#### 3.1.3 General Users
Needs:

- store receipts, bills, reference screenshots, warranty screenshots, app settings, order confirmations
- find them later without digging through the photo gallery

Pain points solved:

- screenshots are mixed with personal photos
- retrieval relies on memory of date taken

#### 3.1.4 Knowledge Hoarders / Personal Knowledge Users
Needs:

- large-scale screenshot collection
- fast retrieval via tags and note snippets
- lightweight system that does not require full note-writing

Pain points solved:

- traditional note apps are too slow for screenshot intake
- gallery systems are not metadata-driven enough

### 3.2 Primary Use Cases

| Use Case | User Goal | SnapBrain Behavior |
| --- | --- | --- |
| Save study slides | Organize screenshots by subject/topic | Import selected screenshots, apply shared tags, optional reminders |
| Save receipts | Keep proof for later lookup | Add tags, short note, reminder if return/warranty date matters |
| Save shopping references | Compare items later | Tag by category/brand, optional note preview in list mode |
| Save inspiration | Revisit visual references | Browse visually in grid mode, retrieve via tags |
| Save reminder screenshots | Turn screenshot into action prompt | Attach date/time reminder to Capture |
| Retrieve later | Find screenshot by meaning, not date alone | Search live across tags and note text, filter smart views |

### 3.3 Secondary Use Cases

- cleaning up screenshot clutter by curating only meaningful imports
- resurfacing unsorted Captures that need classification
- identifying missing originals and relinking them
- exporting metadata as a personal backup artifact

## 4. Functional Requirements

### 4.1 Capture Import

#### 4.1.1 Purpose
Allow users to intentionally add screenshots from the device gallery into SnapBrain as Captures.

#### 4.1.2 Requirements

- Import is manual only in MVP.
- User opens media picker from floating Add Capture button.
- Multi-select import is supported.
- User can deselect selected images before save.
- Import flow includes a quick metadata sheet before final save.
- Tags can be applied to all selected screenshots in one action.
- One shared reminder can optionally be applied to all selected screenshots.
- Note-to-all is not default behavior.
- Per-Capture note editing remains individual in MVP.
- Duplicate warnings appear during import when likely duplicates are detected.
- Duplicate warnings do not hard-block save.
- Save creates Capture records referencing external media URIs plus metadata.

#### 4.1.3 Duplicate Warning Behavior

- Warning appears after selection and before final confirmation.
- App identifies likely duplicates using heuristic metadata matching.
- Warning explains that similar screenshots may already exist in the Library.
- User may:
  - keep all
  - remove selected duplicates from current import batch
  - inspect existing matching Capture if feasible in later iterations

#### 4.1.4 Import Data Collected

- source URI / asset identifier
- imported timestamp
- original created timestamp if available
- file size if available
- dimensions if available
- tags
- note
- reminder
- duplicate flag hint

### 4.2 Library

#### 4.2.1 Purpose
Provide the global browsing home for all Captures.

#### 4.2.2 Requirements

- Library is the default landing screen after onboarding.
- Library shows all Captures in a global timeline.
- No folders exist in MVP.
- User can switch between grid and list view.
- App remembers the last chosen view mode.
- Default browsing mode is grid.
- Smart section shortcuts appear at the top with counts.
- Sorting options exist and are applied to current Library view.
- Graveyard is surfaced as a smart section inside Library.
- Card badges can show reminder, missing original, and duplicate warning indicators.

#### 4.2.3 Sorting Options
Recommended MVP sorting:

- recently added
- oldest added
- recently captured
- oldest captured
- last viewed

Optional if source metadata quality is inconsistent:

- reminder date

### 4.3 Tags

#### 4.3.1 Requirements

- Tags are free-text.
- Emoji are allowed.
- Tags are case-insensitive.
- Canonical form is normalized lowercase.
- `Study` and `study` resolve to the same Tag.
- Tag uniqueness is enforced on normalized canonical value.
- Tag usage count is visible.
- Last used information is visible.
- Users can create tags while typing.
- Users can choose from suggested existing tags while typing.
- Users can rename tags.
- Users can merge tags.
- Users can delete tags.

#### 4.3.2 Rename Behavior

- Renaming updates the canonical form.
- If the new canonical form conflicts with an existing tag, app should propose merge instead of creating duplicate tags.

#### 4.3.3 Merge Behavior

- Merge remaps all Capture associations from source Tag to target Tag.
- Old Tag record is deleted after remap.
- No visible merge history is required in MVP.

#### 4.3.4 Delete Behavior

- Deleting a Tag removes tag associations from linked Captures.
- Capture records remain intact.
- User receives a confirmation prompt showing impact count.

### 4.4 Notes

#### 4.4.1 Requirements

- Note is optional.
- Note is a lightweight multi-line text field.
- No title field exists in MVP.
- Maximum note length is 300 characters.
- Notes appear in search scope.
- Note preview appears only when note exists.

#### 4.4.2 Positioning
Notes are descriptive context, not full content authoring. The product should discourage turning Captures into long-form documents.

### 4.5 Search

#### 4.5.1 Requirements

- Search is instant and updates live as the user types.
- Search checks tag names and note text in MVP.
- Recent searches are stored locally.
- Search supports filters for:
  - unsorted
  - reminders
  - graveyard
  - date
- Search defaults to list-first results for information density.
- Search architecture should support future fuzzy matching and OCR search.

#### 4.5.2 Matching Scope
MVP search scope:

- tag display text / canonical tag name
- note text

Not in MVP:

- OCR text
- filename-based user surface unless explicitly added later

### 4.6 Reminders

#### 4.6.1 Requirements

- One reminder per Capture.
- Reminder supports date and time.
- Reminder can be set during import or later from detail/edit.
- Reminder can be marked done.
- Reminder can be snoozed.
- Reminder can be rescheduled.
- If ignored or unresolved, reminder auto-snoozes to the same time on the next day.
- Reminder badges appear on relevant surfaces.
- Reminders screen organizes upcoming and overdue items.
- Library includes reminder-related smart shortcuts.

### 4.7 Duplicate Handling

#### 4.7.1 Requirements

- Duplicate detection is heuristic-based in MVP.
- Initial heuristic uses practical local metadata rather than expensive image analysis.
- Duplicate detection warns rather than blocks.
- Duplicate hint state may be stored for transparency and future refinement.

### 4.8 Missing Original / Graveyard

#### 4.8.1 Requirements

- A Capture is marked missing when the external file reference can no longer be resolved.
- Missing Captures move into the Graveyard smart view.
- Graveyard uses placeholder thumbnails.
- Capture remains searchable by metadata.
- User can relink missing original.
- User can permanently delete the metadata entry.
- Reminder-bearing missing Captures remain visible in reminder workflows, but flagged as missing.

### 4.9 Deletion Behavior

#### 4.9.1 Requirements

- Deleting a Capture removes the SnapBrain metadata entry only.
- Original screenshot file is not deleted in MVP.
- Deleting from detail view and bulk surfaces should make this explicit.

## 5. Non-Functional Requirements

### 5.1 Performance

- App should remain responsive with roughly 5,000 to 10,000 Captures.
- Browse surfaces should use virtualization and incremental rendering.
- Search should feel immediate on-device for normal queries.
- Tag suggestion and filter interactions should remain low-latency.
- Screen transitions should not depend on full image decoding.

### 5.2 Local-First Reliability

- Core app workflows work without internet.
- Local database is source of truth for metadata.
- UI should not assume background sync or server conflict resolution.

### 5.3 Privacy

- No mandatory account.
- No upload of screenshots in MVP.
- Metadata stays local unless user exports it.
- Notifications should reveal minimal sensitive information by default.

### 5.4 Scalability

- Architecture must tolerate thousands of Captures, many Tags, and frequent searches.
- Schema must support future OCR data without disruptive redesign.
- Background integrity checks for missing originals should be incremental.

### 5.5 Responsiveness and UX

- Common actions should complete in a few taps.
- Editing metadata should avoid modal overload where possible.
- Empty states should educate without blocking.
- Error states should preserve user trust and be explicit about local-storage realities.

### 5.6 Graceful Degradation

- Missing originals should not corrupt metadata.
- If media permissions are denied, app still allows browsing existing metadata.
- If notification permissions are denied, reminder data still exists locally with in-app status indicators.

### 5.7 Extensibility

- Domain model should be stable enough to add OCR, collections, sync, and richer search later.
- Cross-layer abstractions should keep media access, notifications, and future OCR replaceable.

## 6. Information Architecture

### 6.1 Primary Navigation
Bottom tab navigation:

- Library
- Search
- Reminders
- Tags
- Settings

Persistent floating action button:

- Add Capture

### 6.2 Navigation Principles

- Library is the broad home for browsing.
- Search is task-focused retrieval.
- Reminders is time-based workflow.
- Tags is organizational management.
- Settings contains preferences, export, diagnostics, and informational utilities.
- Add Capture is globally accessible from primary app surfaces.

### 6.3 Screen Hierarchy

| Level | Screen |
| --- | --- |
| Root | Onboarding or Main App Shell |
| Main Shell | Library, Search, Reminders, Tags, Settings |
| Secondary | Capture Detail |
| Modal / Sheet | Add Capture picker handoff, metadata sheet, tag actions, filter controls, reminder editor, relink flow, export actions |

### 6.4 Screen Relationships

- Library opens Capture Detail.
- Search results open Capture Detail.
- Reminders items open Capture Detail.
- Tag item opens Library in pre-filtered tag state.
- Smart section cards open pre-filtered Library states.
- Graveyard item opens Capture Detail with missing-original actions.

### 6.5 Smart Views as IA Layer
Smart Views are not standalone tabs in MVP. They are entry points into pre-filtered Library states.

They appear as:

- top shortcut cards on Library
- filter options in Search where relevant
- contextual counts that help users understand system state

### 6.6 Back Navigation Expectations

- From Capture Detail, back returns to prior list/grid/search/reminder context.
- From a smart view, back returns to unfiltered Library if user entered from Library.
- Temporary sheets dismiss back to previous screen without losing unsaved context where possible.

### 6.7 Deep-Linkable Concepts
If deep links are supported later, the most useful targets are:

- Capture Detail by Capture ID
- Tag-filtered Library view
- Graveyard view
- Reminders view

These are future-friendly but not required in MVP.

## 7. Screen-by-Screen Product Specification

### 7.1 Library Screen

#### Purpose
Primary browsing surface for the full Capture Library.

#### User Goal
Scan, revisit, and enter focused subsets of Captures quickly.

#### UI Structure

- top app bar with title and optional sort control
- smart section shortcut cards at top
- view mode toggle
- sorting control
- Capture feed in grid or list mode
- floating Add Capture button

#### Key Components

- smart section soft cards with counts
- grid/list toggle
- sorting chip or sheet trigger
- Capture Card (grid)
- Capture Row (list)

#### Interaction Behavior

- Default browsing view is grid.
- Last chosen view mode persists across sessions.
- Smart section cards open pre-filtered Library subsets.
- Sort change updates current dataset ordering.
- Tap on Capture opens detail.
- Pull-to-refresh is not required for server sync, but can trigger local integrity refresh if product chooses.

#### States

- populated library
- empty library
- filtered smart view
- graveyard filtered view
- permission-degraded metadata-only state

#### Empty State

- illustration or mock Capture card
- message explaining screenshots become organized Captures here
- primary CTA: import screenshots
- lightweight hint showing tags + notes + reminders model

#### Loading State

- skeleton smart cards
- skeleton grid/list placeholders
- avoid blocking entire screen if partial metadata can render first

#### Error State

- local database unavailable
- media access failure for thumbnail resolution
- partial thumbnail failures should degrade per item, not collapse screen

#### Edge Cases

- all Captures missing originals
- very large Library with many tags and reminders
- last chosen view unavailable because of experimental feature change

#### Data Involved

- Capture summary data
- derived smart view counts
- user setting for preferred view mode
- sorting preference

#### Smart Behavior

- smart sections show count badges
- reminder and graveyard counts should update promptly after relevant actions
- grid prioritizes image density, list prioritizes metadata density

#### Performance Notes

- use virtualized rendering in both modes
- avoid decoding full-resolution images in feed
- compute smart counts efficiently via indexed queries or maintained derived state

### 7.2 Add Capture Flow

#### Purpose
Convert selected screenshots from gallery into SnapBrain Captures.

#### User Goal
Quickly import screenshots worth keeping and optionally add basic organization before save.

#### Flow Stages

1. User taps floating Add Capture button.
2. App opens media picker.
3. User selects one or more screenshots.
4. App shows quick metadata sheet.
5. App runs duplicate heuristic and surfaces warnings.
6. User confirms save or adjusts selection.
7. Save completes and user returns to relevant surface.

#### UI Structure

- media picker handoff
- selected item count summary
- selected thumbnail strip or count chip
- shared tag input
- optional shared reminder control
- duplicate warning block if applicable
- per-item note editing entry if selected individually
- save button

#### Interaction Behavior

- User may cancel picker and return with no changes.
- User may deselect items before save.
- Shared tags apply to all selected items.
- Shared reminder applies to all selected items if user chooses one.
- Notes are not mass-applied by default.
- If only one item is selected, note field may be shown inline directly.

#### Duplicate Warning UI

- shown as non-blocking warning panel
- explains count of likely duplicates
- provides action to review affected selections
- final save CTA remains available

#### Save Confirmation Behavior

- On success, show lightweight confirmation with imported count.
- If duplicate warnings were ignored, save still succeeds.
- If some items fail, result should separate success count and failure count.

#### Canceled Import Behavior

- if user exits before selecting anything, no state persists
- if user selected items but abandons metadata sheet, app may discard draft unless draft support is intentionally added later

#### States

- picker idle
- nothing selected
- selected / editing metadata
- duplicate warning present
- saving
- partially saved
- save complete
- media permission denied

#### Edge Cases

- asset URI unavailable after selection
- mixed screenshot and non-screenshot media if picker is not perfectly filterable
- partial metadata availability from media API
- very large selection count

#### Data Involved

- source asset identifiers
- selected URIs
- shared tags
- optional reminder
- duplicate heuristic results
- per-item note values if edited

#### Future Extensibility Notes

- import draft persistence
- OCR queue handoff post-save
- smarter duplicate inspection
- optional screenshot-only auto-filtering

### 7.3 Search Screen

#### Purpose
Provide direct retrieval by metadata rather than browsing.

#### User Goal
Find a Capture quickly by tag, note phrase, reminder state, graveyard state, or date filter.

#### UI Structure

- prominent search bar
- recent searches area when query is empty
- filter controls
- result list in list mode by default
- optional quick switch to grid if user explicitly changes it

#### Key Components

- Search Bar
- recent search chips or rows
- filter pills
- result rows

#### Interaction Behavior

- Results update live as user types.
- Search runs against tags and note text immediately.
- Tapping recent search re-runs it.
- User may clear recent searches individually or all at once if product chooses.
- Filters refine current result set.
- Opening a result goes to Capture Detail.

#### States

- empty query with recent searches
- active query with results
- active query with no results
- filtered results
- graveyard-only results

#### Empty State

- no recent searches yet
- message encouraging search by tag or note phrase

#### No Results UX

- clarify current filters may be restrictive
- provide quick actions to clear filters
- suggest searching by shorter term or tag

#### Loading State

- should be minimal because search is local
- if indexing work is needed, use subtle progress indicator without blocking typing

#### Error State

- database query failure
- corrupted index fallback path

#### Edge Cases

- very short queries with many results
- emoji tag searches
- search results including missing originals

#### Data Involved

- query string
- recent searches
- filter state
- Capture result summaries

#### Smart Behavior

- default result surface is list mode for information density
- result rows can show note preview when present
- missing and reminder badges should remain visible in search results

#### Performance Notes

- debounce is optional but not required if database querying is efficient
- avoid full in-memory scan when indexed search is available

### 7.4 Capture Detail Screen

#### Purpose
Provide the full view and management surface for one Capture.

#### User Goal
Inspect the screenshot, edit metadata, act on reminder state, or manage missing-original issues.

#### Required General Structure

- large image preview
- quick actions row
- open original
- fullscreen
- edit
- tags
- note
- reminder
- metadata
- danger zone

#### Layout Description

- header with back navigation and overflow actions
- large image preview block
- quick actions row immediately below preview
- editable metadata sections stacked vertically
- danger zone at bottom

#### Interaction Model

- inline editing is the default editing model
- user can tap into tags, note, and reminder sections without navigating to separate full pages unless necessary
- fullscreen opens a single-image zoom-only viewer
- open original attempts to open the source asset in the system viewer if accessible

#### Section Details

##### Large Image Preview

- display resolved image when available
- display graveyard placeholder when missing
- tapping preview can open fullscreen

##### Quick Actions Row

- open original
- fullscreen
- edit affordance if inline sections are collapsed

##### Tags

- show associated tags as chips
- allow add/remove inline
- provide suggestions while typing

##### Note

- multi-line editor
- max 300 characters
- character count can appear near limit

##### Reminder

- show scheduled time or "none"
- quick actions for set, done, snooze, reschedule, clear

##### Metadata

Must show:

- created date
- imported date
- file size
- dimensions

Optional if available:

- source URI diagnostics
- last viewed timestamp

##### Danger Zone

- delete Capture metadata
- if missing original, show relink and permanent delete options clearly

#### States

- fully available original
- missing original
- editing metadata
- reminder overdue
- no reminder

#### Empty/Loading/Error Behavior

- detail skeleton if opened before image resolves
- image load failure falls back to placeholder with metadata intact
- if record is deleted elsewhere, show graceful unavailable state and navigate back

#### Edge Cases

- reminder exists but notifications are disabled
- original can be opened by URI but thumbnail loading is intermittent
- merge or delete tag while detail is open

#### Data Involved

- full Capture record
- linked tags
- reminder state
- media metadata

#### Future Extensibility Notes

- OCR preview section
- copy text from OCR
- collections membership
- duplicate cluster context

### 7.5 Reminders Screen

#### Purpose
Provide a time-oriented workflow for action-based Captures.

#### User Goal
Review what needs attention, resolve overdue items, and manage reminder status.

#### UI Structure

- segmented sections or grouped list:
  - overdue
  - upcoming
  - completed or done history if retained in MVP
- reminder rows with status badge and quick actions

#### Interaction Behavior

- tapping reminder row opens Capture Detail
- quick actions can mark done, snooze, or reschedule without leaving screen
- overdue section is visually prioritized
- Library smart shortcut for reminders leads into relevant filtered subset

#### States

- no reminders
- upcoming only
- overdue and upcoming
- completed visible or hidden based on product decision

#### Recommended MVP Position
Include completed reminders only if there is a lightweight retention rule. If completed reminders are stored, they should be visually de-emphasized and optionally collapsible.

#### Empty State

- short message about turning screenshots into reminders
- CTA to add reminder from existing Captures or import new Capture

#### Error and Edge Cases

- notification permission denied
- reminder time in past on creation
- missing-original Capture with active reminder
- auto-snoozed reminders recurring due to repeated ignore behavior

#### Data Involved

- reminder timestamps
- reminder status
- associated Capture summary
- missing/original availability

#### Performance Notes

- reminder queries should use dedicated indexes
- rows should avoid loading large thumbnails unless needed

### 7.6 Tags Screen

#### Purpose
Provide centralized tag management and discovery.

#### User Goal
See tag usage, open related Captures, and maintain a clean tag system.

#### UI Structure

- searchable or scrollable tag list
- each row shows:
  - tag name
  - usage count
  - last used
- row action menu or long-press actions

#### Interaction Behavior

- tap opens Library filtered to that Tag
- action menu supports rename, merge, delete
- merge flow should require choosing target Tag

#### States

- populated tags
- empty tags
- action in progress

#### Empty State

- explain that tags appear as Captures are organized
- CTA to import screenshots

#### Edge Cases

- rename conflict with existing Tag
- deleting heavily used Tag
- emoji-only tags

#### Data Involved

- Tag records
- usage counts
- last used timestamps

#### Performance Notes

- large tag lists should support efficient sorting and searching

### 7.7 Settings Screen

#### Purpose
Control preferences, exports, diagnostics, and app information.

#### UI Structure
Recommended settings groups:

- Preferences
- Backup
- Notifications
- Onboarding
- Diagnostics
- Future Modules
- About

#### Required MVP Settings Concepts

- default view mode
- export SQLite backup
- notification preferences
- onboarding replay
- app info / about
- storage diagnostics
- graveyard management
- OCR placeholder or future module placeholder

#### Interaction Behavior

- settings changes persist immediately unless destructive
- export provides honest explanation of metadata-first backup behavior
- diagnostics expose counts such as total Captures, missing originals, database size estimate, and reminder count

#### Graveyard Management
Can include:

- count of missing originals
- shortcut to Graveyard filtered Library
- optional integrity recheck trigger

#### OCR Placeholder
Purpose is to signal future capability without implying it exists now.

- label as "OCR (coming later)" or similar
- may include educational copy about future on-device search expansion

#### Edge Cases

- export failure due to file permissions
- notifications disabled at system level
- onboarding replay while main shell is active

### 7.8 Onboarding Flow

#### Purpose
Introduce the core mental model with minimal friction.

#### Principles

- 2 to 3 screens only
- lightweight and fast
- explain benefit clearly
- mention privacy/local-first
- do not mention Graveyard

#### Recommended Screen Themes

1. Import screenshots
2. Organize with tags and notes
3. Find things instantly offline

#### UI Behavior

- concise headline
- short supporting copy
- simple illustration or product mockup
- skip and continue affordances

#### Exit Behavior

- onboarding completion sets local flag
- replay accessible from Settings

## 8. Smart Views Definition

### 8.1 Concept
Smart Views are system-defined filtered subsets of the global Library. They are surfaced primarily as top shortcut cards with counts and open into pre-filtered Library states.

### 8.2 Smart View Behaviors

| Smart View | Exact Logic | UI Role |
| --- | --- | --- |
| Recently Added | Captures ordered by imported date descending, limited preview count on card | Browsing shortcut |
| Unsorted | Captures with no tags and no note | Prompt for cleanup |
| Most Used Tags | Derived summary of top tags by usage count; opens tag-centric entry point or filtered tag list | Organization insight |
| Reminder Pending | Captures with reminder scheduled and not done; overdue included with emphasis | Action shortcut |
| Graveyard | Captures where `is_missing = true` | Recovery and cleanup surface |

### 8.3 Unsorted Definition
Unsorted is strictly:

- no tags
- no note

Reminder presence does not make a Capture sorted. This keeps the definition consistent and operationally useful.

### 8.4 Presentation
Smart Views should function as:

- top shortcuts
- count-based soft cards
- entry points into pre-filtered Library states

They are not separate top-level tabs.

### 8.5 Smart View Count Rules

- counts should reflect current library state
- graveyard count should update whenever a missing reference check changes state
- reminder count should focus on pending items, not completed ones

## 9. View Modes and Card Design Logic

### 9.1 Grid Mode

#### Purpose
Browsing-first, image-forward mode.

#### Characteristics

- compact card
- thumbnail dominant
- 1 to 2 visible tags
- tiny badges for reminder, missing, duplicate hint
- minimal metadata text

#### Best For

- visual scanning
- inspiration collections
- quick broad browsing

### 9.2 List Mode

#### Purpose
Information-rich mode for search and management.

#### Characteristics

- thumbnail plus metadata block
- more visible tags
- note preview when note exists
- reminder time visible when relevant
- missing-original status readable

#### Best For

- search results
- reminders
- metadata-heavy browsing

### 9.3 Mode Persistence

- App remembers last chosen Library view mode.
- Search defaults to list results even if Library was last in grid, unless user explicitly changes within Search.

### 9.4 Note Preview Rules

- Note preview appears only if note exists.
- Empty note state should not reserve visual space.

### 9.5 Indicator Rules

- reminder indicator: badge or small clock marker
- missing original indicator: explicit broken-link or missing badge
- duplicate indicator: subtle, secondary badge; not visually alarming after save

## 10. Search System Design

### 10.1 Search Objectives

- retrieve Captures quickly with minimal typing
- support large local libraries without server dependency
- grow from metadata search to richer full-text search later

### 10.2 MVP Search Scope
Searchable fields:

- tag canonical names
- tag display names
- note text

Filterable scopes:

- unsorted
- reminders
- graveyard
- date

### 10.3 Live Result Model

- results update as the user types
- matching should be incremental and local
- empty query shows recent searches rather than a blank results list
- search results default to list mode

### 10.4 Matching Behavior
Conceptual matching approach:

- case-insensitive
- token-aware for note text
- prefix and substring matching for tags where practical
- pragmatic "contains" matching is acceptable in MVP if performance is maintained

### 10.5 Tag Matching

- query should match canonical lowercase tag values
- display original tag casing style only if product chooses to preserve display text; canonical uniqueness still remains lowercase
- emoji tags should be matchable directly

### 10.6 Note Text Matching

- note text indexed for lightweight full-text or indexed substring search
- note limit of 300 characters keeps search scope manageable

### 10.7 Recent Searches

- store recent successful or submitted queries locally
- cap list to a practical number, such as 10 to 20
- include timestamp for recency ordering
- duplicate recent search entries should collapse to one current record

### 10.8 Filter Model
Recommended date filter options:

- imported today
- imported this week
- custom date range

Filter behavior:

- filters combine with active text query
- filters remain visible and removable
- filter state is local to Search session unless product decides to persist last-used filters

### 10.9 Future Search Maturity Path

#### Near-Term

- better ranking
- typo tolerance
- fuzzy matching

#### Mid-Term

- OCR-backed full-text search using `ocr_text`
- ranking that balances tags, note hits, and OCR hits

#### Later

- saved searches
- collections built from query rules
- semantic recall if AI features are introduced

### 10.10 Architectural Preparation for OCR
OCR is not MVP, but search architecture should assume future searchable fields beyond note and tags. Query composition and indexing strategy should be extensible so `ocr_text` can be added without redesigning all search UI.

## 11. Tag System Design

### 11.1 Tag Principles

- friction must stay low
- duplicate tags should be prevented
- tags should remain flexible, not overly normalized into rigid taxonomies

### 11.2 Tag Normalization

- canonical form is lowercase
- trim surrounding whitespace
- collapse obvious duplicate spacing if product chooses
- preserve emoji

Example:

- `Study` -> `study`
- ` study ` -> `study`
- `Ideas💡` -> `ideas💡`

### 11.3 Uniqueness Rules

- uniqueness enforced on canonical value
- multiple visual case variants must not create separate Tags

### 11.4 Tag Creation UX

- user types into tag input
- system shows matching suggestions from existing Tags
- user can tap suggestion or create new normalized Tag
- already-attached tags should not reappear as available suggestions for the same Capture

### 11.5 Suggestion UX

- suggestions prioritize prefix matches first
- then recent or frequently used tags
- empty tag field can optionally show recently used tags

### 11.6 Duplicate Prevention Logic

- if typed tag resolves to an existing canonical tag, reuse existing Tag ID
- do not create near-identical duplicates due to casing

### 11.7 Rename Behavior

- user edits tag name
- system recomputes canonical form
- if no conflict, update tag record and derived displays
- if conflict, present merge choice

### 11.8 Merge Behavior

- user selects source tag and target tag
- remap all linked `capture_tags` rows
- delete old tag
- refresh usage counts and last-used derivations
- no visible merge history in MVP

### 11.9 Delete Behavior

- delete tag record
- delete related rows in join table
- retain Capture records
- warn with affected Capture count

### 11.10 Usage Analytics Fields
Useful tag fields:

- usage count
- created at
- last used at
- last renamed at if product wants auditability

Usage count may be derived rather than stored, but for scale it can be cached if maintained safely.

## 12. Reminder System Design

### 12.1 Reminder Model

- one reminder per Capture
- reminder belongs to a single Capture
- reminder can be pending, overdue, done, snoozed, or cleared

### 12.2 Date and Time Support

- reminder requires both date and time
- timezone behavior should be device-local
- if user changes timezone, reminder evaluation should follow local device time unless a stronger cross-device system is added later

### 12.3 Notification Behavior

- local notifications only in MVP
- reminder notification should open the associated Capture when tapped if possible
- notification content should avoid exposing too much screenshot content on lock screen by default

### 12.4 Done, Snooze, Reschedule

- done: marks reminder resolved
- snooze: pushes time by quick presets or custom interval
- reschedule: open date/time picker
- clear: removes reminder from Capture

### 12.5 Overdue Behavior

- overdue reminders appear at top of Reminders screen
- overdue badges appear on Capture surfaces
- overdue is a view state, not a separate record type

### 12.6 Ignored Reminder Auto-Snooze
If a reminder remains ignored or unresolved, the system auto-snoozes it to the same time on the next day.

Implementation behavior at product level:

- preserve original reminder intent while preventing stale permanent overdue state
- track last auto-snoozed timestamp for observability
- clearly distinguish rescheduled reminders from completed ones

### 12.7 Reminders Tab Organization
Recommended sections:

- overdue
- today / soon
- upcoming
- done or recently completed if retained

### 12.8 Relationship to Library Shortcut

- reminder shortcut card in Library opens pending reminder subset
- overdue count can be emphasized visually within that card

## 13. Duplicate Detection Strategy

### 13.1 Product Position
Duplicate detection in MVP is advisory, not authoritative.

### 13.2 MVP Heuristic Basis
Use pragmatic metadata signals such as:

- source URI or persistent asset identifier when available
- file size
- dimensions
- created timestamp
- imported timestamp proximity

### 13.3 Warning Model

- detect likely duplicates during import
- surface warning in metadata sheet or confirmation area
- allow user to continue
- optionally flag saved Capture with duplicate hint for later review

### 13.4 Why This Tradeoff

- avoids costly image analysis in MVP
- avoids false confidence from weak visual hashing
- preserves fast import flow
- keeps product honest about uncertainty

### 13.5 Future Improvements

- image hash comparison
- duplicate clusters
- semantic duplicate suggestions
- post-import duplicate review smart view

## 14. Missing Original / Graveyard System

### 14.1 What Makes a Capture Missing
A Capture is missing when its external image reference cannot be resolved or opened from the underlying device media library or file path.

### 14.2 Detection Triggers
Missing state can be detected:

- when rendering thumbnail or detail preview
- during explicit integrity checks
- during app startup maintenance for sampled subsets
- during reminder or search result hydration

Detection should be incremental, not a full-library blocking scan on every launch.

### 14.3 Graveyard Concept
Graveyard is a smart view inside Library for Captures whose original image files are unavailable but whose metadata still exists.

### 14.4 Placeholder Thumbnail Usage

- use a clear but calm placeholder visual
- communicate missing original status without implying total data loss
- preserve associated tags, note, reminder, and metadata display

### 14.5 Graveyard Smart Section Behavior

- appears alongside other smart section cards
- shows current missing count
- opens filtered Library view containing only missing Captures

### 14.6 Relink Flow

- user opens missing Capture
- chooses relink action
- app allows selecting a replacement image
- system updates source URI and revalidates metadata where possible
- note, tags, reminder, imported date, and other SnapBrain metadata remain attached

### 14.7 Permanent Deletion Flow

- user can permanently delete the SnapBrain metadata record
- confirmation should make clear this removes the Capture from SnapBrain only

### 14.8 Search and Reminder Impact

- missing Captures remain searchable by tags and note text
- reminder-bearing missing Captures remain in reminder flows with missing badge
- opening such reminder should land in detail view with relink option

### 14.9 Metadata Retained After Original Is Missing

- Capture ID
- tags
- note
- reminder
- created/imported dates
- file size and dimensions if previously known
- source URI history if retained
- duplicate hint state

### 14.10 User Trust Considerations
The product must be explicit that SnapBrain MVP references original files rather than duplicating them. Graveyard is a consequence of the lightweight model and should be explained honestly in backup and diagnostics surfaces.

## 15. Data Model and Database Design

### 15.1 Data Model Principles

- local database is the metadata source of truth
- media files remain external in MVP
- schema should support future OCR, collections, and sync without redesigning core Capture identity

### 15.2 Core Entities

#### 15.2.1 `captures`

| Field | Type / Concept | Notes |
| --- | --- | --- |
| `id` | primary key | Stable Capture identifier |
| `source_uri` | text | External image reference |
| `source_asset_id` | text nullable | Persistent media library ID if available |
| `created_at` | datetime nullable | Original image creation time if available |
| `imported_at` | datetime | SnapBrain import time |
| `updated_at` | datetime | Metadata update time |
| `note` | text nullable | Max 300 characters |
| `is_missing` | boolean | True when original unavailable |
| `missing_detected_at` | datetime nullable | First or latest detection timestamp |
| `file_size_bytes` | integer nullable | Source file size if available |
| `width` | integer nullable | Pixel width |
| `height` | integer nullable | Pixel height |
| `duplicate_group_hint` | text nullable | Weak grouping token for duplicate review |
| `duplicate_warning_state` | text nullable | For example none, likely_duplicate, user_ignored |
| `last_viewed_at` | datetime nullable | Useful for sort and ranking |
| `ocr_status` | text nullable | Future-ready: none, pending, complete, failed |
| `ocr_text` | text nullable | Future-ready |
| `deleted_at` | datetime nullable | Soft-delete support if needed internally |

#### 15.2.2 `tags`

| Field | Type / Concept | Notes |
| --- | --- | --- |
| `id` | primary key | Stable Tag identifier |
| `name` | text | Display name |
| `canonical_name` | text unique | Lowercase normalized value |
| `created_at` | datetime | Creation time |
| `updated_at` | datetime | Latest update |
| `last_used_at` | datetime nullable | Updated when applied or touched |
| `usage_count_cached` | integer nullable | Optional cached value |

#### 15.2.3 `capture_tags`

| Field | Type / Concept | Notes |
| --- | --- | --- |
| `capture_id` | foreign key -> captures.id | Part of composite uniqueness |
| `tag_id` | foreign key -> tags.id | Part of composite uniqueness |
| `created_at` | datetime | Association time |

Unique constraint:

- (`capture_id`, `tag_id`)

#### 15.2.4 `reminders`

| Field | Type / Concept | Notes |
| --- | --- | --- |
| `id` | primary key | Stable reminder ID |
| `capture_id` | foreign key -> captures.id unique | One reminder per Capture |
| `scheduled_for` | datetime | Active reminder timestamp |
| `status` | text | pending, overdue, done, snoozed, cleared |
| `done_at` | datetime nullable | Completion time |
| `snoozed_until` | datetime nullable | Current snooze target if separate from scheduled field |
| `last_notified_at` | datetime nullable | Notification diagnostics |
| `last_auto_snoozed_at` | datetime nullable | For ignored reminder behavior |
| `created_at` | datetime | Creation time |
| `updated_at` | datetime | Latest update |

#### 15.2.5 `recent_searches`

| Field | Type / Concept | Notes |
| --- | --- | --- |
| `id` | primary key | |
| `query_text` | text | Search string |
| `filters_json` | text nullable | Serialized filter state |
| `used_at` | datetime | Last used timestamp |

#### 15.2.6 `settings`

| Field | Type / Concept | Notes |
| --- | --- | --- |
| `key` | primary key | Setting identifier |
| `value` | text | Serialized value |
| `updated_at` | datetime | Latest update |

#### 15.2.7 `backup_exports`

| Field | Type / Concept | Notes |
| --- | --- | --- |
| `id` | primary key | |
| `exported_at` | datetime | Export time |
| `format` | text | sqlite |
| `includes_assets` | boolean | False in MVP |
| `notes` | text nullable | Human-readable backup honesty message |

### 15.3 Optional Future Entity

#### 15.3.1 `capture_search_index`
If separate indexing is needed later:

| Field | Type / Concept | Notes |
| --- | --- | --- |
| `capture_id` | foreign key | One row per Capture |
| `search_blob` | text | Combined metadata text |
| `ocr_text` | text nullable | Future |
| `updated_at` | datetime | |

This may be unnecessary if the chosen local database provides efficient FTS support directly.

### 15.4 Relationships

- one Capture to many Tags via `capture_tags`
- one Capture to zero or one Reminder
- one Capture can be missing without losing metadata
- recent searches are standalone
- settings are key-value based

### 15.5 Indexing Strategy

Recommended indexes:

- `captures(imported_at desc)`
- `captures(created_at desc)`
- `captures(is_missing, imported_at desc)`
- `captures(last_viewed_at desc)`
- `captures(duplicate_group_hint)`
- `tags(canonical_name unique)`
- `tags(last_used_at desc)`
- `capture_tags(tag_id, capture_id)`
- `capture_tags(capture_id, tag_id)`
- `reminders(status, scheduled_for asc)`
- `reminders(capture_id unique)`
- `recent_searches(used_at desc)`

Search-related indexing:

- use FTS or equivalent indexing for note text
- join tag canonical names into search strategy
- leave room to add OCR text indexing later

### 15.6 Tag Usage Derivation vs Storage
Preferred rule:

- derive usage count from `capture_tags` for correctness
- optionally cache usage count on `tags` if query cost becomes meaningful at scale

If cached, updates must be transactionally maintained.

### 15.7 Migration Considerations

- schema versioning is required from day one
- future OCR fields should be additive migrations
- collections should add new tables without breaking Capture semantics
- cloud sync should not require changing Capture IDs retroactively

### 15.8 Backup and Export Considerations
SQLite export in MVP should preserve:

- captures metadata
- tags and relations
- reminders
- settings if useful
- recent searches optionally

Export honesty:

- backup is metadata-first
- full visual restoration depends on original screenshots still being available on the same device or re-linked later

## 16. Application Architecture

### 16.1 Layered Architecture

#### 16.1.1 UI Layer
Responsibilities:

- render screens and reusable components
- manage visual states and interaction affordances
- remain decoupled from storage details

#### 16.1.2 State Layer
Responsibilities:

- screen state
- filter state
- view mode preference
- temporary import draft state
- query state and derived UI state

#### 16.1.3 Domain / Business Logic Layer
Responsibilities:

- import orchestration
- tag normalization
- reminder rules
- duplicate detection heuristics
- missing original detection and Graveyard transitions
- search composition

#### 16.1.4 Persistence Layer
Responsibilities:

- local database CRUD
- indexes and migrations
- transactions for save, tag merge, delete, reminder updates

#### 16.1.5 Media Access Layer
Responsibilities:

- media picker integration
- source URI resolution
- thumbnail access
- missing-original validation
- relink flows

#### 16.1.6 Notification Layer
Responsibilities:

- local reminder scheduling
- notification permission state
- tap-through into Capture Detail
- reschedule and auto-snooze updates

#### 16.1.7 Optional Future OCR / Service Abstraction Layer
Responsibilities:

- OCR job queue
- OCR status updates
- searchable text persistence
- future ML provider abstraction

### 16.2 Boundary Rules

- UI should not directly embed tag normalization logic.
- Reminder auto-snooze rules should live in domain logic, not view code.
- Database operations that affect multiple tables should be transactional.
- Media access failures should surface through explicit domain error types.

### 16.3 Implementation Notes for Expo-Managed-Friendly Delivery
Product remains framework-neutral, but a practical implementation path can be:

| Concern | Recommended Direction |
| --- | --- |
| Navigation | Tab + stack navigation with modal/sheet patterns |
| Local database | SQLite with migration support and optional FTS capability |
| State management | Lightweight client-state store plus query/repository pattern |
| Large list rendering | High-performance virtualized list implementation |
| Media picker | Expo-friendly media picker access with permissions handling |
| Notifications | Expo-friendly local notifications scheduling |
| Image display | Cached thumbnail-oriented image component |

### 16.4 Architecture Decisions That Matter Most

- keep Capture identity stable and local
- isolate media references from metadata persistence
- design search to expand cleanly to OCR
- prevent screen-level logic from owning business rules

## 17. Performance and Scale Strategy

### 17.1 Scale Assumption
Design for approximately 5,000 to 10,000 Captures with acceptable responsiveness on mainstream mobile devices.

### 17.2 List Virtualization

- all Capture feeds must use virtualized rendering
- grid and list modes require tuned item sizing to minimize layout thrash
- avoid rendering offscreen note previews or large badges unnecessarily

### 17.3 Thumbnail Handling

- use gallery-provided thumbnails or resized image requests where possible
- never load full-resolution images into scrolling feeds
- fullscreen should load higher fidelity only on demand

### 17.4 Lazy Rendering

- render card metadata incrementally if needed
- defer secondary details such as note preview or file diagnostics until row is near viewport

### 17.5 Database Indexing

- index all common sort and filter fields
- use text indexing strategy appropriate for note search
- avoid full table scans for reminder and graveyard queries

### 17.6 Incremental Metadata Hydration

- list views should load summary records first
- detail view should hydrate full metadata and image state as needed
- missing-state checks should be asynchronous when possible

### 17.7 Sorting and Query Performance

- sort options should map to indexed columns
- expensive derived sort orders should be avoided in MVP
- precompute or cache smart view counts if repeated query cost becomes visible

### 17.8 Search Responsiveness

- query execution should remain local and indexed
- if query cost grows, use lightweight debounce rather than sacrificing instant feel
- search result rows should reuse list rendering primitives

### 17.9 Background-Safe Metadata Updates

- missing-original integrity checks should run in batches
- reminder auto-snooze updates should be lightweight and idempotent
- duplicate hint computation during import should remain bounded

### 17.10 Minimizing Expensive Re-Renders

- preserve stable item keys
- avoid rerendering the full list when only view state of one Capture changes
- isolate filter state changes from global app rerenders

### 17.11 Grid vs List Performance

- grid mode optimizes for image density and should keep overlays minimal
- list mode carries more metadata and should be the default for search, not always for broad browsing

### 17.12 Handling Large Tag Sets

- tag suggestion queries should be indexed
- long tag lists in Tags screen should support incremental rendering or efficient search
- avoid eagerly loading all tag relationships into every screen

### 17.13 Reminder Query Efficiency

- one-reminder-per-Capture simplifies query complexity
- dedicated reminder indexes support upcoming and overdue sections efficiently

## 18. Design System

### 18.1 Core Visual Philosophy
SnapBrain MVP uses a light-mode-only visual system with a soft white productivity aesthetic. The design should feel calm, tactile, premium, and modern, with restrained neu-skeuomorphic depth rather than exaggerated retro neumorphism.

Key qualities:

- soft white surfaces
- subtle sage accent
- generous corner radii
- calm depth and shadow layering
- clean hierarchy
- low visual noise

### 18.2 Color Direction

- base background: warm or neutral soft white
- elevated surfaces: slightly tinted white
- accent: muted sage green
- text: deep gray, not pure black
- status colors: restrained and legible

Sage should be used for:

- selected chips
- key buttons
- active states
- focus accents
- reminder highlights where appropriate, without replacing status semantics

### 18.3 Typography Hierarchy

- large screen title
- section title
- primary body
- secondary metadata
- small badge text

Typography should emphasize:

- clarity
- calm density
- readable metadata
- consistent line heights

### 18.4 Spacing System
Use a consistent spacing scale with enough air to support soft-depth visuals.

Principles:

- compact within cards
- generous between major sections
- consistent chip and badge padding

### 18.5 Icon Treatment

- simple rounded icons
- line icons or lightly filled icons
- avoid harsh heavy iconography
- status icons should remain legible at small size

### 18.6 Radius System

- large radius for cards and sheets
- medium radius for inputs and list rows
- pill radius for chips, filter pills, and badges

### 18.7 Shadow Rules

- subtle outer shadow for elevated cards
- occasional faint highlight edge for tactile depth
- avoid stacked dramatic shadows
- preserve contrast and readability over decorative depth

### 18.8 Card Depth Model

- background plane
- elevated smart cards
- content cards
- active pressed state with reduced shadow and slight inset feel

### 18.9 Surface Hierarchy

- app background
- secondary raised surfaces
- high-priority action elements
- overlays and sheets

Each step up in hierarchy should use modest depth, not dramatic contrast.

### 18.10 Badge Styling

- small pill forms
- concise text or icon
- semantic color use should be muted but distinct
- reminder and missing states should be clearly distinguishable

### 18.11 Chip Styling

- soft pill with subtle border or inset shading
- active tag chips use sage-tinted fill
- inactive chips remain calm and readable

### 18.12 Form and Input Styling

- rounded fields
- soft recessed or lightly inset appearance
- clear focus state using sage accent
- sufficient contrast for body text and placeholder text

### 18.13 Motion Principles

- subtle microinteractions only
- short, calm transitions
- pressed states and sheet reveals should feel tactile
- avoid playful bounce or distracting motion

### 18.14 Maintaining Clarity While Using Soft Depth

- depth should support grouping, not substitute for layout
- text contrast must stay high
- not every element should cast a shadow
- active states must be obvious without relying only on shadows

## 19. Neu-Skeuomorphic UI Rules

### 19.1 Design Intent
The app should feel tactile and premium, but restrained. This is refined modern neu-skeuomorphism: soft depth, slight materiality, calm surfaces, no exaggerated "puffy" controls.

### 19.2 App Background

- soft white or lightly warm neutral plane
- very subtle gradient or tonal shift allowed
- background should not compete with content

### 19.3 Smart Section Cards

- slightly elevated
- soft corners
- count and label clearly separated
- tactile tap state with reduced lift

### 19.4 Capture Cards

- grid cards should feel like premium tiles
- use gentle depth and clipped thumbnails
- overlays must stay restrained to protect image readability

### 19.5 Search Bar

- lightly inset or recessed field
- soft shadow or inner highlight
- clear active focus state

### 19.6 Floating Action Button

- strongest depth in the interface, but still restrained
- sage-accented primary action
- should feel tappable and clearly above the content plane

### 19.7 Tag Chips

- soft pill forms
- subtle raised or pressed states
- active and selected chips use sage tint

### 19.8 Filter Pills

- similar to tag chips but visually secondary
- selected state must remain obvious

### 19.9 Toggle Controls

- segmented toggle or dual pill control
- clear active state through fill and slight depth change

### 19.10 Inline Editors

- note and tag editors should use lightly inset fields
- avoid full dense form borders
- editing affordances should feel integrated, not enterprise-heavy

### 19.11 Reminder Badges

- compact pill or icon-plus-pill
- use mild emphasis for overdue state
- avoid loud red-heavy styling unless necessary for clarity

### 19.12 Settings Cells

- grouped soft panels
- each cell should feel touchable with light separation and depth

## 20. Component Library

### 20.1 Capture Card (Grid)

#### Purpose
Compact visual browsing tile for Library grid.

#### Visual Description

- rounded thumbnail card
- 1 to 2 tag chips
- tiny badges for reminder, missing, duplicate

#### Behavior

- tap opens detail
- long-press can support future bulk mode

#### States

- normal
- missing original
- reminder pending
- selected if future bulk mode added

#### Usage Contexts

- Library grid
- filtered Library subsets

### 20.2 Capture Row (List)

#### Purpose
Information-rich representation for search and management contexts.

#### Visual Description

- left thumbnail
- right metadata stack
- tags, note preview if note exists, reminder status, missing flag

#### Behavior

- tap opens detail
- supports quick swipe actions only if added later

### 20.3 Smart Section Card

#### Purpose
Entry point into system-defined smart views.

#### Visual Description

- soft card
- label
- count
- optional secondary hint

#### States

- default
- highlighted when count is meaningful
- empty but still visible or hidden based on design decision

### 20.4 Search Bar

#### Purpose
Primary query input for Search screen.

#### Behavior

- live updates
- clear action
- focus and cancel behavior as appropriate

### 20.5 Tag Chip

#### Purpose
Display and edit tag associations.

#### States

- inactive
- active
- removable
- suggestion

### 20.6 Reminder Badge

#### Purpose
Surface reminder status without overwhelming card layouts.

#### States

- upcoming
- overdue
- done if shown
- missing-original-with-reminder combination

### 20.7 Floating Add Button

#### Purpose
Primary action entry to Add Capture flow.

#### Behavior

- visible across main shell screens unless a screen-specific reason hides it
- opens media picker flow

### 20.8 Filter Controls

#### Purpose
Apply quick narrowing to Search or filtered Library states.

#### States

- idle
- selected
- removable

### 20.9 View Toggle

#### Purpose
Switch between grid and list modes.

#### Behavior

- persists Library preference
- may remain local to Search unless explicitly persisted

### 20.10 Empty State Block

#### Purpose
Communicate no-content states with action guidance.

#### Usage Contexts

- empty library
- empty tags
- no reminders
- no search results
- empty graveyard

### 20.11 Graveyard Placeholder Card

#### Purpose
Represent missing-original Captures without broken visual layout.

#### Visual Description

- calm placeholder illustration or icon
- missing label
- retained metadata beneath or beside it

### 20.12 Metadata Sheet

#### Purpose
Quick import-time editing surface for shared tags and reminder.

#### Behavior

- supports duplicate warning display
- supports deselection review
- concise and fast

### 20.13 Tag Action Menu

#### Purpose
Manage Tag operations from Tags screen or detail contexts.

#### Actions

- rename
- merge
- delete

## 21. Empty States, Loading States, and Error States

### 21.1 Empty State Strategy
Empty states should do three things:

- explain what this area is for
- reassure the user that nothing is broken
- provide one clear next step

### 21.2 Required Empty States

#### Empty Library
Must include:

- illustration or mock card
- short product message
- import CTA button
- lightweight hint explaining tags and notes

Suggested message direction:

- "Save screenshots you actually want to find later."

#### Empty Tags

- explain tags appear once Captures are organized
- CTA to import screenshots

#### No Reminders

- explain that reminders can be attached to Captures
- CTA to add reminder from Library or new import

#### No Search Results

- show active query and filter awareness
- action to clear filters or refine query

#### Graveyard Empty

- reassure user that all linked originals are currently available

#### Import Canceled / Nothing Selected

- brief non-error confirmation
- no persistent warning needed

### 21.3 Loading Behavior

- use lightweight skeletons for lists and cards
- loading should not feel like network waiting; keep it subtle and fast
- avoid global blocking spinners when partial UI can render

### 21.4 Processing Indicators

- saving imports: small progress state
- exporting backup: explicit temporary progress
- integrity checks: low-priority indicator in diagnostics, not full-screen blocking

### 21.5 Broken Image Handling

- if thumbnail fails, show placeholder at item level
- if full image fails, preserve metadata and offer relink if source is missing

### 21.6 Permission-Denied Handling

- media permission denied: explain import limitation and provide retry/open settings action
- notification permission denied: reminders still exist in-app, but notifications are unavailable

### 21.7 Media Access Failure Handling

- if picker cannot open, show concise error with retry
- if selected asset disappears before save, mark that item failed without blocking all others

## 22. Privacy and Data Ownership

### 22.1 Privacy Position
SnapBrain is a privacy-forward local tool. Users should understand that their screenshots and metadata stay on-device in MVP unless they explicitly export data.

### 22.2 Local Storage Model

- metadata stored locally
- screenshots referenced locally
- no mandatory server dependency

### 22.3 Account Model

- no account required
- no forced signup
- no cloud lock-in

### 22.4 Upload Policy

- screenshots are not uploaded in MVP
- metadata is not uploaded in MVP

### 22.5 User Value Proposition

- fast local retrieval
- more control over sensitive screenshots
- lower trust burden than cloud-first tools

### 22.6 Future Privacy Considerations

- optional encryption at rest
- optional user-controlled sync
- optional cloud backup with explicit consent
- user-controlled export and restore

## 23. Future Extensibility Roadmap

### 23.1 Planned Evolution Areas

#### OCR with ML Kit

- on-device OCR extraction
- store `ocr_text`
- update `ocr_status`

#### Full-Text OCR Search

- extend Search to include OCR matches
- distinguish metadata hits from OCR hits in ranking if needed

#### Better Fuzzy Search

- typo tolerance
- token ranking
- stronger partial matching

#### Collections / Saved Filters

- allow users to save reusable filtered subsets
- keep separate from MVP's folderless tag-first model

#### Optional Auto-Import

- detect screenshots automatically
- must remain opt-in

#### Cloud Backup / Sync

- optional, not required
- should preserve privacy expectations and local-first behavior

#### OAuth Sign-In

- only if cloud features exist
- never prerequisite for core offline utility

#### Stronger Duplicate Detection

- image fingerprinting
- duplicate review surfaces

#### AI-Assisted Tagging

- optional suggestions, not automatic destructive changes

### 23.2 Architectural Hooks Needed From Day One

- future-ready OCR fields in schema
- modular search composition
- separable media and metadata layers
- stable Capture IDs
- export/import versioning
- notification abstraction

## 24. Design and Engineering Handoff Notes

### 24.1 How UI Designers Should Use This Document

- translate the defined IA, screen behaviors, and component rules into production-ready layouts
- preserve the folderless global Library model
- maintain distinction between grid browsing and list retrieval
- use soft-depth design rules without sacrificing clarity

### 24.2 How React Native Developers Should Use This Document

- treat this as the product contract for navigation, states, flows, and system behavior
- keep product-level behavior intact even if implementation details differ
- enforce local-first behavior and metadata-first storage model

### 24.3 How Database / Schema Designers Should Use This Document

- implement the conceptual schema with robust migrations and indexing
- preserve future-ready fields such as `ocr_text`, `ocr_status`, `is_missing`, `deleted_at`, `duplicate_group_hint`, and `last_viewed_at`
- optimize for 5k to 10k Capture scale, not demo data

### 24.4 How Future AI Coding Agents Should Use This Document

- treat terminology as fixed
- do not reintroduce folders into MVP
- do not convert OCR into a shipped feature prematurely
- preserve explicit edge-case rules for graveyard, reminders, duplicates, and backup honesty

### 24.5 Recommended Implementation Breakdown

1. Design system and component primitives
2. Schema and local data layer
3. Navigation shell
4. Add Capture flow
5. Library and Search
6. Reminders
7. Tags
8. Graveyard and missing-original handling
9. Backup and Settings
10. Future OCR module hooks

### 24.6 Final Product Integrity Rules
The following decisions are foundational and must remain intact unless the product is intentionally re-scoped:

- MVP is folderless
- Captures live in a global Library
- organization uses tags, notes, smart views, search, and reminders
- Unsorted means no tags and no note
- search is live and checks tags plus note text initially
- import is manual and multi-select
- tags can be applied to all selected imports
- reminder can be applied to all selected imports
- note-to-all is not default behavior
- deleting a Capture removes SnapBrain metadata only
- missing originals go to Graveyard
- Graveyard is a smart section within Library
- one reminder per Capture
- ignored reminders auto-snooze to the same time next day
- tags normalize to lowercase and allow emoji
- note is multi-line and limited to 300 characters
- detail editing is inline
- fullscreen is single-image zoom only
- backup is metadata-first and must be described honestly

