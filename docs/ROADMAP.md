# CareAtlas — Roadmap

One milestone at a time. Each milestone must be committed, tested and documented before the next begins.

---

## Milestone 1 — CareAtlas Copilot ✓ Complete
**Branch:** `feature/milestone-1-copilot` → merged to `main` 2026-10-29
**Goal:** Functional Copilot panel with `/ndis` workflow end-to-end.

### Delivered
- Copilot side panel (persistent, collapsible, topbar toggle)
- Slash command registry (`/ndis` available, 7 stubs registered)
- Patient context selector (5 synthetic patients)
- WorkflowEngine — reusable 6-step state machine
- `/ndis` workflow: purpose → evidence → warnings → draft → approval gate → download
- 28 automated tests (all passing)

---

## Milestone 2 — Clinical Coding & Data Quality (In Development)
**Branch:** `feature/milestone-2-coding`
**Goal:** `/coding` slash command — identify and surface coding issues for clinician review.

### Success criteria
- [ ] Select a patient and type `/coding`
- [ ] Choose review scope (full / completeness / medications / investigations)
- [ ] See categorised coding issues (missing codes, specificity gaps, medication mismatches, investigation alerts)
- [ ] Select which suggestions to include
- [ ] Generate a coding review summary
- [ ] Approve and download the review
- [ ] All M1 functionality continues to work
- [ ] 31 automated tests passing

### Scope
- `modules/data/coding-rules.js` — 5 rule families (completeness, duplication, medication, specificity, investigations)
- `modules/commands/coding.js` — 6-step workflow
- `tests/coding.test.js` — 31 tests
- Registry updated: `/coding` status → available

### Out of scope for Milestone 2
- Real MBS billing rules
- Code update write-back to clinical record
- Automated record changes of any kind

---

## Milestone 3 — Planned Care & Medicare Intelligence (Proposed)
**Brief received:** 2026-10-29

A longitudinal patient and practice planning system. Moves general practice from reactive appointment-driven care to proactive, coordinated, person-centred care.

**Full brief stored in:** `docs/PLANNED_CARE_BRIEF.md`

### Intended scope (vertical slice only)
1. Patient onboarding and preference profiling
2. Adaptive pre-visit questionnaires
3. 12-month rolling care planner (clinical needs, patient goals, GP/nurse capacity)
4. Medicare intelligence engine — versioned, validated rules; no auto-claim
5. Two scheduling models: Planned Care and Flexible/Opportunistic
6. `.ics` calendar file generation
7. Practice resource dashboard
8. Audit trail integration
9. Engagement and sustainability metrics

**Development sequencing (per brief §21):**
> Do not start Planned Care until the current milestone is stable and approved.
> Record requirements now → Complete M2 → Test M2 → Report → Obtain approval → Begin M3.

### Architecture constraint
Must reuse CareAtlas infrastructure (WorkflowEngine, audit trail, patient data model, rule registry).
Must not duplicate task, rules or audit engines.
Same architecture must eventually support `/ndis`, `/coding`, `/recall`, `/medications`, Planned Care, Medicare Intelligence, QualityOS, CareAtlas Learn.

---

## Milestone 4 — Recalls & Reminders (Proposed)
Closed-loop recall management, communication history, escalation.
**Slash command:** `/recall`

## Milestone 5 — QualityOS (Proposed)
Practice quality improvement, PDSA cycles, audit evidence, reporting.

## Milestone 6 — CareAtlas Learn / CPD (Proposed)
CPD capture from clinical questions, exportable evidence record.
