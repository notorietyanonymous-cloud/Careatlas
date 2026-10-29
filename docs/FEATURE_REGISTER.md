# CareAtlas — Feature Register

Status definitions: `Proposed` | `Designed` | `In Development` | `Demonstrated` | `Tested` | `Production Ready`

---

## CareAtlas Copilot (Milestone 1) ✓

| Feature | Status | Notes |
|---------|--------|-------|
| Copilot side panel | Tested | Persistent, collapsible, topbar toggle |
| Slash command registry | Tested | `/ndis` + `/coding` available, 6 stubs |
| Patient context selector | Tested | 5 synthetic patients |
| `/ndis` workflow engine | Tested | 6-step state machine, 28 tests passing |
| Document preview + edit | Tested | contenteditable draft |
| Clinician approval gate | Tested | Hard gate — approval required |
| Document download | Tested | .txt download |
| Audit trail | Tested | Full event log per workflow |
| `/workcover` command | Proposed | Same engine, different template |
| `/referral` command | Proposed | |
| Real AI integration | Proposed | Provider-agnostic interface ready |

---

## Clinical Coding & Data Quality (Milestone 2)

| Feature | Status | Notes |
|---------|--------|-------|
| `/coding` workflow | In Development | 6-step state machine |
| Completeness rules | In Development | Flags conditions missing ICD-10 |
| Duplication rules | In Development | Flags same ICD-10 stem coded twice |
| Medication reconciliation rules | In Development | Medication → expected condition mapping |
| Specificity rules | In Development | Suggests specific sub-codes (E11→E11.2 etc.) |
| Investigation alert rules | In Development | HbA1c, eGFR, PHQ-9, DEXA result triggers |
| Coding review summary (download) | In Development | AI-drafted, clinician-approved, .txt |
| Coding tests | In Development | 31 tests — all passing |
| Code write-back to record | Proposed | Requires clinical system integration |
| MBS billing rules | Proposed | Separate Medicare intelligence engine (M3) |

---

## Triage Queue

| Feature | Status | Notes |
|---------|--------|-------|
| View routing | Demonstrated | |
| Live DB connection | Demonstrated | Docker local only |
| Acuity filters | Demonstrated | |
| Open patient record | Demonstrated | |

---

## Patient Record

| Feature | Status | Notes |
|---------|--------|-------|
| Conditions list | Demonstrated | |
| Medications list | Demonstrated | |
| Investigations | Demonstrated | |
| Appointments | Demonstrated | |
| Care plan | Proposed | |

---

## Planned Care & Medicare Intelligence (Milestone 3)

| Feature | Status | Notes |
|---------|--------|-------|
| Patient onboarding / preference profiling | Proposed | See docs/PLANNED_CARE_BRIEF.md |
| Adaptive pre-visit questionnaires | Proposed | |
| 12-month rolling care planner | Proposed | |
| Two scheduling models (Planned / Flexible) | Proposed | |
| Medicare intelligence engine (versioned rules) | Proposed | No auto-claim; clinician verification required |
| MBS update monitoring workflow | Proposed | Simulated; real API integration deferred |
| Practice resource dashboard | Proposed | |
| `.ics` calendar file generation | Proposed | |
| Patient engagement analytics | Proposed | |
| Billing compliance role model | Proposed | |

---

## All other modules
`Proposed` — see ROADMAP.md for sequence.
