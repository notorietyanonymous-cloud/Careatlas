/**
 * /ndis workflow definition
 *
 * Defines the 12-step NDIS document workflow for CareAtlas Copilot.
 * Uses WorkflowEngine (workflow-engine.js) — this file provides
 * only the step definitions and NDIS-specific logic.
 *
 * SAFETY: This workflow never generates, signs or submits a document
 * automatically. All content requires clinician review and approval.
 * Missing evidence, conflicting information and unsupported claims
 * are surfaced to the clinician — never silently resolved.
 *
 * All patient data used here is synthetic/fictional.
 */

const NDIS_PURPOSES = [
  { id: 'access',      label: 'NDIS Access Request',           description: 'Support an application for NDIS access — confirming disability and functional impact.' },
  { id: 'plan_review', label: 'Plan Review Support Letter',    description: 'Provide clinical evidence for a participant\'s plan review.' },
  { id: 'functional',  label: 'Functional Impact Report',      description: 'Detail how a condition affects the participant\'s daily functioning.' },
  { id: 'specialist',  label: 'Specialist Referral for NDIS', description: 'Refer for specialist assessment to support an NDIS application.' },
  { id: 'support',     label: 'Supporting Evidence Letter',    description: 'General clinical letter supporting an existing NDIS application or appeal.' },
];

const NDIS_STEPS = [
  // ── Step 1: Select document purpose ─────────────────────────
  {
    id: 'select_purpose',
    title: 'Select document purpose',
    description: 'What type of NDIS document does this patient need?',
    validate(data) {
      if (!data.purpose) return { ok: false, error: 'Please select a document purpose.' };
      if (!NDIS_PURPOSES.find(p => p.id === data.purpose)) return { ok: false, error: 'Invalid purpose selected.' };
      return { ok: true };
    },
    render(state, context) {
      const patient = context.patient;
      return `
        <div class="wf-section">
          <p class="wf-patient-context">
            <strong>${patient.name}</strong> · ${patient.age}${patient.sex} · ${patient.medicare}
            ${patient.interpreterNeeded ? `<span class="wf-badge wf-badge-warn">Interpreter: ${patient.language}</span>` : ''}
          </p>
          <div class="wf-purpose-list">
            ${NDIS_PURPOSES.map(p => `
              <label class="wf-purpose-option">
                <input type="radio" name="ndis_purpose" value="${p.id}" />
                <div class="wf-purpose-content">
                  <div class="wf-purpose-label">${p.label}</div>
                  <div class="wf-purpose-desc">${p.description}</div>
                </div>
              </label>`).join('')}
          </div>
        </div>`;
    },
    collect() {
      const selected = document.querySelector('input[name="ndis_purpose"]:checked');
      return selected ? { purpose: selected.value } : {};
    },
  },

  // ── Step 2: Retrieve and display clinical evidence ────────────
  {
    id: 'review_evidence',
    title: 'Clinical evidence',
    description: 'Relevant clinical information retrieved from this patient\'s record.',
    validate() { return { ok: true }; },
    render(state, context) {
      const p = context.patient;
      const rel = p.ndisRelevance || {};
      const purpose = NDIS_PURPOSES.find(x => x.id === state.purpose);

      const conditions = p.conditions.map(c =>
        `<div class="wf-evidence-row">
          <span class="wf-ev-label">${c.name}</span>
          <span class="wf-ev-meta">ICD-10: ${c.icd10} · Since ${c.since}</span>
        </div>`).join('');

      const meds = p.medications.map(m =>
        `<div class="wf-evidence-row">
          <span class="wf-ev-label">${m.name} ${m.dose}</span>
          <span class="wf-ev-meta">${m.frequency}</span>
        </div>`).join('');

      const investigations = p.investigations.map(i =>
        `<div class="wf-evidence-row ${i.flagged ? 'wf-ev-flagged' : ''}">
          <span class="wf-ev-label">${i.name}</span>
          <span class="wf-ev-meta">${i.result || 'Pending'} ${i.flagged ? '⚠ Abnormal' : ''}</span>
        </div>`).join('');

      const impacts = (rel.functionalImpact || []).map(f =>
        `<div class="wf-evidence-row"><span class="wf-ev-label">→ ${f}</span></div>`).join('');

      const supportDocs = (rel.supportingDocs || []).map(d =>
        `<div class="wf-evidence-row wf-ev-ok"><span class="wf-ev-label">✓ ${d}</span></div>`).join('');

      return `
        <div class="wf-section">
          <div class="wf-purpose-badge">Document type: <strong>${purpose?.label || state.purpose}</strong></div>
          <div class="wf-ev-group"><div class="wf-ev-group-title">Active conditions</div>${conditions || '<em>None recorded</em>'}</div>
          <div class="wf-ev-group"><div class="wf-ev-group-title">Current medications</div>${meds || '<em>None recorded</em>'}</div>
          <div class="wf-ev-group"><div class="wf-ev-group-title">Relevant investigations</div>${investigations || '<em>None recorded</em>'}</div>
          ${impacts ? `<div class="wf-ev-group"><div class="wf-ev-group-title">Documented functional impact</div>${impacts}</div>` : ''}
          ${supportDocs ? `<div class="wf-ev-group"><div class="wf-ev-group-title">Supporting documents on file</div>${supportDocs}</div>` : ''}
        </div>`;
    },
    collect() { return {}; },
  },

  // ── Step 3: Missing evidence warnings ────────────────────────
  {
    id: 'missing_evidence',
    title: 'Missing information',
    description: 'The following information is absent or incomplete. Review before generating a draft.',
    validate() { return { ok: true }; },
    render(state, context) {
      const p = context.patient;
      const missing = p.ndisRelevance?.missingDocs || [];
      const warnings = buildWarnings(p, state);

      if (missing.length === 0 && warnings.length === 0) {
        return `<div class="wf-section"><div class="wf-all-ok">✓ No critical gaps identified. You may proceed to draft generation.</div></div>`;
      }

      const missingHtml = missing.map(m =>
        `<div class="wf-warning-row wf-warn-missing">
          <span class="wf-warn-icon">⚠</span>
          <div><strong>Missing document:</strong> ${m}</div>
        </div>`).join('');

      const warningHtml = warnings.map(w =>
        `<div class="wf-warning-row wf-warn-${w.severity}">
          <span class="wf-warn-icon">${w.severity === 'critical' ? '✕' : '⚠'}</span>
          <div><strong>${w.label}:</strong> ${w.detail}</div>
        </div>`).join('');

      return `
        <div class="wf-section">
          <p class="wf-warn-intro">These gaps will be noted in the generated draft. The clinician must address them before the document can be used.</p>
          ${missingHtml}${warningHtml}
          <div class="wf-warn-note">⚠ CareAtlas does not invent missing evidence. Missing items will appear as placeholders requiring clinical input.</div>
        </div>`;
    },
    collect() { return {}; },
  },

  // ── Step 4: Generate draft ────────────────────────────────────
  {
    id: 'generate_draft',
    title: 'Draft document',
    description: 'AI-drafted document — requires clinician review before use.',
    validate(data) {
      if (!data.draftContent || data.draftContent.trim().length < 50) {
        return { ok: false, error: 'Document content appears empty. Please review the draft.' };
      }
      return { ok: true };
    },
    render(state, context) {
      const draft = generateNDISDraft(context.patient, state);
      return `
        <div class="wf-section">
          <div class="wf-draft-label">
            ⚠ AI-DRAFTED · UNVERIFIED · NOT FOR CLINICAL USE UNTIL APPROVED
          </div>
          <div
            id="wf-draft-editor"
            class="wf-draft-editor"
            contenteditable="true"
            spellcheck="true"
          >${draft}</div>
          <p class="wf-draft-note">Edit directly in the document above. All changes are recorded in the audit trail.</p>
        </div>`;
    },
    collect() {
      const el = document.getElementById('wf-draft-editor');
      return el ? { draftContent: el.innerText, draftHtml: el.innerHTML } : {};
    },
  },

  // ── Step 5: Clinician approval ────────────────────────────────
  {
    id: 'clinician_approval',
    title: 'Clinician review & approval',
    description: 'Review the document and confirm it is clinically accurate before approval.',
    validate(data) {
      if (!data.approvalConfirmed) {
        return { ok: false, error: 'You must confirm clinical review before approving this document.' };
      }
      return { ok: true };
    },
    render(state, context) {
      const p = context.patient;
      const missing = p.ndisRelevance?.missingDocs || [];
      const warnings = buildWarnings(p, state);
      const hasWarnings = missing.length > 0 || warnings.length > 0;

      const warningBlock = hasWarnings ? `
        <div class="wf-approval-warnings">
          <strong>⚠ Unresolved gaps from Step 3:</strong>
          <ul>${[...missing, ...warnings.map(w => w.label)].map(w => `<li>${w}</li>`).join('')}</ul>
          <p>These items remain unresolved. Approving means you have addressed them in the edited draft above or accept the limitations.</p>
        </div>` : '';

      return `
        <div class="wf-section">
          ${warningBlock}
          <div class="wf-approval-summary">
            <div class="wf-approval-row"><span>Patient:</span> <strong>${p.name}</strong></div>
            <div class="wf-approval-row"><span>Document:</span> <strong>${NDIS_PURPOSES.find(x => x.id === state.purpose)?.label || state.purpose}</strong></div>
            <div class="wf-approval-row"><span>Clinician:</span> <strong>${context.clinician}</strong></div>
            <div class="wf-approval-row"><span>Date:</span> <strong>${new Date().toLocaleDateString('en-AU')}</strong></div>
          </div>
          <label class="wf-approval-check">
            <input type="checkbox" id="wf-approval-confirm" />
            I have reviewed this document. The clinical content is accurate to the best of my knowledge. I understand this document will be attributed to me.
          </label>
          <div class="wf-approval-note">
            By approving, you take clinical responsibility for this document. CareAtlas does not verify clinical accuracy.
          </div>
        </div>`;
    },
    collect() {
      const cb = document.getElementById('wf-approval-confirm');
      return { approvalConfirmed: cb?.checked || false };
    },
  },

  // ── Step 6: Output and audit close ────────────────────────────
  {
    id: 'complete',
    title: 'Document ready',
    description: 'The document has been approved and is ready to download.',
    validate() { return { ok: true }; },
    render(state, context) {
      const p = context.patient;
      const purposeLabel = NDIS_PURPOSES.find(x => x.id === state.purpose)?.label || state.purpose;
      return `
        <div class="wf-section wf-complete">
          <div class="wf-complete-icon">✓</div>
          <h3>Document approved</h3>
          <p>${purposeLabel} for <strong>${p.name}</strong></p>
          <p class="wf-complete-meta">Approved by ${context.clinician} · ${new Date().toLocaleDateString('en-AU')}</p>
          <button id="wf-download-btn" class="btn-primary wf-download-btn">Download document</button>
          <div class="wf-billing-note">
            ⚠ Billing review: Completing NDIS documentation may attract a relevant MBS item. Review with your billing officer before invoicing.
          </div>
        </div>`;
    },
    collect() { return {}; },
  },
];

// ─── Helpers ──────────────────────────────────────────────────

function buildWarnings(patient, state) {
  const warnings = [];
  const p = patient;

  if (!p.conditions || p.conditions.length === 0) {
    warnings.push({ severity: 'critical', label: 'No diagnoses recorded', detail: 'NDIS requires documented diagnoses with ICD-10 codes.' });
  }

  const hasFunctionalAssessment = (p.investigations || []).some(i =>
    i.name.toLowerCase().includes('functional') || i.name.toLowerCase().includes('ot') || i.name.toLowerCase().includes('capacity')
  );
  if (!hasFunctionalAssessment) {
    warnings.push({ severity: 'moderate', label: 'No functional capacity assessment', detail: 'NDIS access requests are strengthened by a formal functional capacity assessment.' });
  }

  if (p.ndisRelevance?.eligible === 'unlikely') {
    warnings.push({ severity: 'critical', label: 'NDIS eligibility concern', detail: 'Based on current clinical record, this patient may not meet NDIS eligibility criteria. Proceed with caution.' });
  }

  return warnings;
}

function generateNDISDraft(patient, state) {
  const p = patient;
  const purposeLabel = NDIS_PURPOSES.find(x => x.id === state.purpose)?.label || 'NDIS Document';
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const missing = p.ndisRelevance?.missingDocs || [];

  const conditionList = (p.conditions || [])
    .map(c => `• ${c.name} (ICD-10: ${c.icd10}) — diagnosed ${c.since}`)
    .join('\n');

  const medList = (p.medications || [])
    .map(m => `• ${m.name} ${m.dose} — ${m.frequency}`)
    .join('\n');

  const impactList = (p.ndisRelevance?.functionalImpact || [])
    .map(f => `• ${f}`)
    .join('\n');

  const missingBlock = missing.length > 0
    ? `\n\n[CLINICIAN NOTE — DRAFT ONLY]\nThe following information was not available at the time of drafting and requires clinical completion before this document is submitted:\n${missing.map(m => `• ${m}`).join('\n')}`
    : '';

  return `${purposeLabel.toUpperCase()}\n${'─'.repeat(purposeLabel.length)}\n\nDate: ${today}\nClinician: ${p.gp}\nPatient: ${p.name}\nDate of birth: ${new Date(p.dob).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}\nMedicare: ${p.medicare}\n\nTo whom it may concern,\n\nI write in support of ${p.name}'s application to the National Disability Insurance Scheme.\n\nI have been ${p.name}'s treating general practitioner and have known this patient for a significant period. I am familiar with their medical history and current functional status.\n\nDIAGNOSES\n${conditionList || '[No diagnoses recorded — REQUIRES CLINICAL COMPLETION]'}\n\nCURRENT TREATMENT\n${medList || '[No medications recorded — REQUIRES CLINICAL COMPLETION]'}\n\nFUNCTIONAL IMPACT\n${impactList || '[Functional impact not documented — REQUIRES CLINICAL COMPLETION]'}\n\nIn my clinical opinion, ${p.name}'s conditions cause [REQUIRES CLINICAL INPUT: describe impact on daily activities, self-care, mobility, communication and social participation as relevant to the purpose of this document].\n\nI support ${p.name}'s application for NDIS support and am available to provide further clinical information if required.\n\nYours sincerely,\n\n${p.gp}\n[Practice name — COMPLETE BEFORE SUBMISSION]\n[Provider number — COMPLETE BEFORE SUBMISSION]\n[Contact details — COMPLETE BEFORE SUBMISSION]${missingBlock}\n\n---\nDOCUMENT STATUS: AI-DRAFTED · UNVERIFIED · REQUIRES CLINICIAN REVIEW AND APPROVAL BEFORE USE\nGenerated by CareAtlas Copilot · Synthetic demonstration data`;
}

if (typeof module !== 'undefined') {
  module.exports = { NDIS_STEPS, NDIS_PURPOSES, generateNDISDraft, buildWarnings };
}
