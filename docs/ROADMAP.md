# CareAtlas — Roadmap

One milestone at a time. Each milestone must be committed, tested and documented before the next begins.

---

## Milestone 1 — CareAtlas Copilot (In Development)
**Branch:** `feature/milestone-1-copilot`
**Goal:** A functional Copilot side panel with `/ndis` workflow end-to-end.

### Success criteria
- [ ] Select a fictional patient
- [ ] Open Copilot panel
- [ ] Type `/ndis` and see command suggestion
- [ ] Choose document purpose
- [ ] See synthetic evidence and missing-information warnings
- [ ] Generate and edit a draft document
- [ ] Approve through simulated clinician workflow
- [ ] Download the document
- [ ] See task and audit history updated
- [ ] All existing navigation continues to work

### Scope
- Copilot panel UI (persistent, collapsible)
- Slash command registry
- Patient context selector
- `/ndis` document workflow (12 steps)
- Reusable workflow engine for future slash commands
- Simulated clinician approval controls
- Audit trail (simulated)

### Out of scope for Milestone 1
- Real AI integration
- Real patient data
- Billing workflow
- Any other slash commands (architecture only)

---

## Milestone 2 — Clinical Data Quality (Proposed)
Uncoded diagnoses, duplicate conditions, medication discrepancies, coding metrics.

## Milestone 3 — Recalls & Reminders (Proposed)
Closed-loop recall management, communication history, escalation.

## Milestone 4 — QualityOS (Proposed)
Practice quality improvement, PDSA cycles, audit evidence.

## Milestone 5 — CareAtlas Learn / CPD (Proposed)
CPD capture from clinical questions, exportable evidence record.
