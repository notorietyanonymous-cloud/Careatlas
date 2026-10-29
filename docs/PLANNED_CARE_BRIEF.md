# CareAtlas — Planned Care Brief
**Status:** Proposed (recorded 2026-10-29)
**Intended milestone:** 3
**Prerequisite:** Milestone 2 (Clinical Coding) complete and approved

This document records the full development brief for the Planned Care feature.
Implementation does not begin until Milestone 2 is approved by the chairperson.

---

## Objective

Build CareAtlas Planned Care: a longitudinal patient and practice planning system that moves general practice from reactive, appointment-driven care to proactive, coordinated, person-centred care.

**Core design principle:**
> The clinical need determines the care. The patient helps determine how and when it is delivered. Medicare funding and practice resources support that care.

---

## 9 Integration domains

1. Patient onboarding and preference profiling
2. Adaptive pre-visit questionnaires
3. Longitudinal clinical care planning (12-month rolling view)
4. Medicare eligibility and service opportunity identification
5. Patient-controlled appointment planning
6. Practice workforce and appointment capacity optimisation
7. Calendar integration (`.ics` initially)
8. Continuous monitoring of Medicare item changes
9. Patient engagement and practice sustainability analytics

---

## Patient onboarding

Capture patient preferences:
- Preferred appointment days, times, format (in-person/telehealth)
- Preferred clinician / usual GP
- Preferred communication method and reminder preferences
- Willingness to receive proactive care recommendations
- Preference for Planned Care or Flexible/Opportunistic Care
- Calendar integration preference
- Accessibility requirements, language requirements, digital-support needs

Patient goals (patient-reported, not diagnosis-derived):
- Maintaining mobility, managing a chronic condition, improving sleep, remaining independent, improving fitness, managing pain, reducing medication burden, preventing deterioration

**Constraints:**
- Clinical information comes from authorised clinical records, not questionnaire alone
- Patients can skip optional questions, change preferences, decline questionnaires, opt out of proactive scheduling
- Opting out must not restrict access to normal care

---

## Adaptive pre-visit questionnaires

- Short, context-sensitive (not a large generic form)
- Condition-specific questions (diabetes, frailty, mental health review)
- Do not ask patients to re-enter information already available
- Produce a structured pre-consultation summary for clinician
- Clearly separate patient-reported from verified clinical information
- Do not auto-change diagnoses or medications based on responses

---

## 12-month care planner

For every proposed care activity, record:
- Clinical reason, priority, recommended timeframe
- Appropriate clinician/team, expected appointment duration
- Whether it can be combined with another service
- Relevant MBS item (if any), eligibility verification status
- Patient preference, scheduling status, completion status

Distinguish safety-critical follow-up from optional preventive opportunities.

---

## Two scheduling models

**A. Planned Care:** CareAtlas proposes a 12-month schedule. Patient can accept, decline, defer, reschedule or combine appropriate appointments.

**B. Flexible / Opportunistic Care:** Patient books as preferred. CareAtlas identifies overdue care and offers opportunities during existing appointments. Safety-critical recalls remain actively managed regardless of preference.

Patient can switch between models.

---

## Medicare intelligence engine

Versioned, validated rules architecture supporting Australian MBS items.

Per rule record:
- MBS item number, description, effective date
- Eligibility conditions, frequency/interval restrictions
- Co-claiming restrictions, provider requirements, documentation requirements
- Exclusions, authoritative source, rule version, validation status

**Critical constraints:**
- Do not invent Medicare eligibility rules
- Do not infer eligibility from diagnosis alone
- Mark unsupported rules "Requires verification"
- Do not auto-submit Medicare claims
- Do not mark an item eligible based solely on AI inference
- Do not generate appointments merely because an item may be billable

Status ladder: Clinical care indicated → Potential Medicare eligibility → Eligibility requires verification → Not currently eligible → Service completed → Billing reviewed/confirmed

---

## MBS update monitoring (future architecture)

Controlled update process:
1. Detect new/amended items from authoritative sources
2. Identify changes (eligibility, frequency, documentation, co-claiming, exclusions)
3. Produce proposed CareAtlas rules update
4. Identify affected workflows and patient cohorts
5. Require authorised review and approval
6. Test against representative synthetic scenarios
7. Publish versioned rules update with effective date + audit log entry
8. Notify practices

For prototype: demonstrate using a controlled simulated MBS rule update. Do not claim live government integration.

---

## Billing compliance allocation

Responsibilities by role:
- **Treating clinician:** confirms service provided, clinical appropriateness, documentation, billing decision
- **Reception/billing staff:** process claims, invoices, rejected claims, administrative information
- **Practice manager:** billing workflows, exceptions, staff training, compliance reviews, internal audits
- **Principal GP / clinical governance lead:** billing policy, systemic compliance risk, clinical governance
- **CareAtlas:** check rules, flag discrepancies, explain requirements, flag missing documentation, generate review tasks, maintain audit trails

CareAtlas must not determine legal liability or certify a claim as compliant.

---

## Practice resource dashboard

Display: proposed planned-care appointments, upcoming care-plan reviews, GP/nurse demand, availability, overdue reviews, combine-compatible activities, unallocated tasks, patients preferring opportunistic care, estimated future resource requirements.

Practice configures: staffing, appointment types/lengths, sessions, clinician/nurse availability, reserved capacity, service capability.

Start with transparent scheduling rules, not a black-box optimisation algorithm.

---

## Calendar integration

Initially: downloadable `.ics` calendar invitations.
Future: Apple Calendar, Google Calendar, Outlook Calendar.

**Constraints:**
- Minimum necessary information in calendar entries
- No diagnoses or sensitive clinical information in calendar titles/descriptions
- No automatic external calendar entries without patient action

---

## Patient preference profile

Based on patient-provided preferences and relevant platform interactions.
Patients can view and change relevant preferences.

**Must not create:**
- Hidden profitability scores, patient-value scores, compliance scores, desirability scores, risk-of-noncompliance labels
- Any profiling used to restrict access or deprioritise care

---

## Quality, outcomes and sustainability metrics

Patient outcomes: completion of clinically indicated reviews, continuity, patient-reported goals, timeliness, overdue recalls, engagement rates, questionnaire opt-out rates.

Practice performance: planned vs opportunistic distribution, GP/nurse utilisation, care-plan completion and review rates, clinically appropriate Medicare utilisation, billing compliance exceptions.

**Purpose:** determine whether Planned Care improves clinical outcomes + patient experience + continuity + practice sustainability.
Never optimise revenue at the expense of clinical appropriateness or patient access.

---

## Minimum working demonstration (vertical slice)

Fictional demo patient: T2DM, Hypertension, Osteoarthritis, existing CDM plan, relevant preventive needs.

11 steps to demonstrate:
1. Patient onboarding
2. Care preference selection (Planned or Flexible)
3. Pre-visit questionnaire (completable or skippable)
4. Care plan generation for clinician review
5. Clinical needs identification (CDM review, monitoring, preventive)
6. Simulated Medicare eligibility check (versioned rules, verification status shown)
7. Patient accepts/declines/reschedules proposed appointment
8. Allocation against synthetic practice capacity
9. `.ics` calendar invitation generated
10. Visit completion simulation → care plan updates
11. Full audit trail: recommendation → patient decision → clinician review → appointment → Medicare check → completion

Must have working application state and persistence, not static screens.

---

## Architecture requirement

Do not build Planned Care as an isolated application.
Reuse CareAtlas infrastructure: Patient → Care needs → Tasks → Rules → Appointments → Approvals → Documents → Billing → Audit → Quality measurement.

Same architecture supports: `/ndis`, `/coding`, `/workcover`, `/referral`, `/recall`, `/medications`, Planned Care, Medicare Intelligence, QualityOS, CareAtlas Learn.

Avoid duplicate task, rules or audit engines for individual modules.

---

## Privacy and development environment boundary

Development remains: Mac mini → Docker Desktop → CareAtlas → local database

**Synthetic patients only. No real patient data at this stage.**
See ARCHITECTURE.md for full boundary specification.

---

## Testing requirements

Automated tests covering at minimum:
- Questionnaire completion and opt-out
- Patient preference changes
- Planned Care and Flexible Care selection
- Missing and contradictory clinical data
- Duplicate appointment prevention
- Medicare frequency restrictions and unverified rules
- Patient rescheduling and declining
- Calendar file generation
- Care-plan completion updates
- Audit events and persistence
- Role-based access (where implemented)

Test both expected workflows and failure states.

---

## Completion report requirements (§20 of brief)

At milestone end, report: implementation, deliberate omissions, branch/commit references, files created/changed, DB/schema changes, Docker changes, dependencies introduced, tests created and results, demo reproduction steps, limitations, clinical-safety assumptions, Medicare-rule assumptions, technical debt, screenshots, recommended next milestone.

Do not begin another milestone automatically. Stop and allow review.
