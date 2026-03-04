# Manual Smoke Checklist

## Launch and navigation

- Launch the app on Android or iPhone from Expo Go.
- Confirm Library, Search, Reminders, Tags, and Settings tabs render.
- Confirm Add Capture FAB opens the import flow.

## Library

- Confirm Library renders without a crash.
- Confirm smart sections render.
- Confirm grid browsing still works.

## Add Capture flow

- Open the import picker.
- Grant or deny photo permission and confirm each state is understandable.
- Select multiple screenshots.
- Confirm duplicate warning appears when a known duplicate path is present.
- Deselect at least one selected item before save.
- Save the batch and confirm Captures appear in Library.

## Capture detail

- Open one imported Capture.
- Confirm large preview renders.
- Enter edit mode.
- Save tags.
- Save a note.
- Save a reminder.
- Confirm null or missing file size shows as `Unknown`.
- Use `Open original`.
- Use `Fullscreen`.
- Delete the Capture and confirm the UI messaging stays metadata-only.

## Fullscreen preview

- Open fullscreen preview from Capture detail.
- Confirm single-image preview opens.
- Confirm zoom behavior is usable on device.

## Tags

- Open Tags tab.
- Create a tag.
- Rename a tag.
- Merge one tag into another existing canonical tag.
- Delete a tag.
- Open related Captures from a tag row.

## Notes for failures

- If `Open original` fails, record:
  - platform
  - device
  - URI scheme such as `content://`, `file://`, or `ph://`
- If startup times out, note whether `start:tunnel` changes the outcome.
