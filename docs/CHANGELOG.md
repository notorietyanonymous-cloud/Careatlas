# CareAtlas — Changelog

## [Unreleased] — Milestone 1: CareAtlas Copilot
- Branch: `feature/milestone-1-copilot`
- Status: Awaiting chairperson approval to merge to main

### Added
- Copilot side panel (persistent, collapsible, topbar toggle)
- Slash command registry with `/ndis` workflow and 7 command stubs
- Patient context selector (5 synthetic patients)
- WorkflowEngine — reusable state machine for all slash command workflows
- `/ndis` workflow: purpose selection → clinical evidence → missing-info warnings → editable draft → clinician approval gate → download → audit trail
- 28 automated tests covering engine, workflow definitions, registry and data
- `modules/` directory structure for future milestones
- `tests/` directory

### Architecture decisions
- Vanilla JS (no framework) — matches existing codebase, no build step needed
- State machine pattern — testable, provider-agnostic, reusable across commands
- AI interface not yet wired — ready for any provider
- Synthetic data isolated in `modules/data/`

---

## [0.1.0] — Initial Prototype
- Static HTML prototype with 14 views
- Visual design system (Inter + DM Serif Display, teal/blue/amber palette)
- View routing via sidebar navigation
- Triage queue with acuity filters (live data via Docker/PostgreSQL)
- Patient record view (conditions, medications, investigations, appointments)
- 5 synthetic test patients seeded in local database
- Local Docker environment (PostgreSQL + Express API + nginx)
- Project documentation initialised
