# Fictional legacy: Field Planner

SIMULATED REQUIREMENTS FIXTURE. No code or live application accompanies this file.

Users manage scheduled site visits. Viewers can inspect visits; editors can modify them. A left sidebar contains Visits, Map, and Import. The compact list layout and terminology should remain familiar. Exact colors, dimensions, and screenshots are unavailable.

## Visits

Editors drag a visit within a day's list to change its order. Cross-day drops are rejected with feedback. Escape cancels a drag. Saved order survives reload. Viewers cannot reorder. Standard create/edit/delete actions also exist, with confirmation for deletion.

## Map

Editors enter an explicit edit mode to move a site marker or edit its polygon vertices. Save persists geometry; Cancel discards the unsaved change. Reopening shows the saved geometry. Viewers can pan/zoom but cannot edit. Invalid self-intersecting polygons are rejected.

## Import

Editors open Import, select a CSV with site_id, name, latitude, and longitude, preview validation errors, then confirm valid rows. Duplicate site_id values are reported and not silently overwritten. Invalid coordinates are rejected. The result reports created and rejected rows. Cancel before confirmation writes nothing.

## Machine workflow

A nightly job produces tomorrow's visit summary for a notification integration. Recipients and timezone configuration are unknown. Re-running a completed job should not send duplicate messages, but that behavior has not been observed.

All statements above are fixture assertions, not runtime evidence. Discovery must preserve that distinction.
