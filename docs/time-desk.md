# Personal start and time desk

- First launch opens Today with an empty private snapshot. It never generates sample records or replaces an existing snapshot, import or account record.
- Main navigation: Today, Personal, Professional, Time. Diary, gratitude and reflection entry points are removed from the primary experience. Prior written records remain stored.
- Time includes a continuously running stopwatch, pause/resume, task/project/personal attribution, manual entries, editing/deleting entries, and weekly plans versus actual records.
- Running timers persist in account-scoped localStorage and survive reloading or closing the app. Other tabs observe timer state. Stop uses a same-origin Web Lock when supported and deterministic timer/day record IDs to avoid repeated saves. A saved timer is cleared only after the records are verified in local storage.
- New precise entries store seconds plus compatible fractional minutes. Existing whole-minute entries remain readable. Active segments split at local midnight; paused periods are excluded. Timers exceeding 24 recorded hours are paused for correction.
- Plans are weekly allocations to a workspace, project or task. Overlapping parent/child allocations in the same week are rejected, so budget totals do not double count. Actual unplanned activity is reported separately. Weekly planned time is not prorated or interpreted as goal achievement.
- Time records remain in the same current snapshot; cloud/account integration status is unchanged. The suspended LifeOS database has not been restored or migrated by this change.

Checks: TypeScript/build, old/new record compatibility, pause/resume arithmetic, local-midnight splitting, actual attribution and date filters, allocation overlap rules, startup and preference smoke checks, browser flows and responsive layout.
