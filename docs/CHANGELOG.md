# CareAtlas — Changelog

## [Unreleased] — Milestone 2: Clinical Coding & Data Quality
- Branch: `feature/milestone-2-coding`
- Status: In Development

### Added
- `modules/data/coding-rules.js` — 5 rule families: completeness, duplication, medication reconciliation, ICD-10 specificity, investigation alerts
- `modules/commands/coding.js` — 6-step `/coding` workflow (select focus → review issues → select suggestions → generate summary → clinician approval → complete)
- `tests/coding.test.js` — 31 automated tests (all passing)
- New CSS: `.wf-option`, `.wf-finding-*`, `.wf-all-clear`, `.wf-approval-block`, `.wf-complete-block`, `.wf-badge-critical`, `.wf-badge-info`

### Changed
- `modules/commands/registry.js` — `/coding` status updated from `coming_soon` to `available`
- `modules/copilot.js` — `startWorkflow()` now routes `coding` module; `downloadDocument()` handles both `/ndis` and `/coding` filenames
- `index.html` — added `<script>` tags for `coding-rules.js` and `coding.js`
- `docs/ROADMAP.md` — M1 marked complete; M2 in development; M3 (Planned Care) added as Proposed with full scope
- `docs/FEATURE_REGISTER.md` — M2 features added; M3 (Planned Care) features added as Proposed

### Architecture decisions
- Coding rules are pure functions (no DOM, no AI dependency) — testable independently of the UI
- Module-level cache (`_findings`, `_summaryText`) bridges render → collect within a step cycle
- Same WorkflowEngine used for `/coding` and `/ndis` — no duplication

---

## [1.0.0] — Milestone 1: CareAtlas Copilot
- Branch: `feature/milestone-1-copilot` → merged to `main` 2026-10-29
- Approved by chairperson 2026-10-29

### Added
- Copilot side panel (persistent, collapsible, topbar toggle)
- Slash command registry with `/ndis` workflow and 7 command stubs
- Patient context selector (5 synthetic patients)
- WorkflowEngine — reusable state machine for all slash command workflows
- `/ndis` workflow: purpose selection → clinical evidence → missing-info warnings → editable draft → clinician approval gate → download → audit trail
- 28 automated tests covering engine, workflow definitions, registry and data
- `modules/` directory structure for future milestones
- `tests/` directory
- Full project documentation: PRODUCT_VISION, ROADMAP, FEATURE_REGISTER, ARCHITECTURE, CLINICAL_SAFETY, CHANGELOG, README

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
