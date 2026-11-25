# Mi espacio: personal y profesional

## Functional release

The same private snapshot now drives four views: Today, Personal, Professional and Review. Existing project/task IDs, historical days, notes and the full legacy backup are preserved. No database or external business records are moved by this release.

- Today combines the daily record, priorities, habits and links to business workspaces.
- Personal provides optional daily metrics, historical records, habits, journal, learning, experiences, personal projects and goals.
- Professional groups projects, tasks, a tap-friendly weekly agenda, completed tasks and time by workspace. Default business spaces are Traka, Aquabon, Tintorería Constitución and Otros proyectos; additional spaces can be created.
- Review derives wellbeing averages only from recorded values and shows completed tasks and recorded time by workspace for 7 or 30 days.
- Quick capture offers a daily record, task, manual time or journal. Focus blocks support optional project attribution and tab reload recovery.

## Data model extensions

Optional `project.workspaceId` and `task.workspaceId`; a task linked to a project takes that project's scope. Existing unassigned records are shown as `Por organizar`, without guessing their business. `S.workspaces` stores additional named spaces. `S.timeEntries` stores new explicitly attributed time (`id`, `date`, `minutes`, `projectId`, `workspaceId`, `taskId`, `note`). Old unassigned focus time is retained and never fabricated into project time.

These are organizational scopes for a single user's current private snapshot; they do not introduce shared business membership or a new authorization boundary.

## Still separate / pending

- Traka Workspace's CRM, documents and financial records remain in their original database and app; this release does not import or duplicate them.
- Laundry operations (orders, customers, cash register and expenses in TintoApp) remain in their original app.
- The existing LifeOS cloud project remains paused; current local saving, export/import, existing account behavior and phone activation blockers are unchanged. A common active backend and unified sign-in need a separate migration with access tests and preservation of the existing records.
- Pulso Android is not represented as connected until its actual integration is activated.

## Validation

Build/TypeScript; scope isolation and derived summaries; preservation of unassigned records; browser checks for phone/tablet/desktop, project creation, task assignment, time recording, daily metrics and reload persistence.
