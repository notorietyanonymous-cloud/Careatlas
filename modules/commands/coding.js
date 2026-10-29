/**
 * CareAtlas /coding workflow — Clinical Coding & Data Quality
 *
 * Uses WorkflowEngine (workflow-engine.js).
 * Rules from modules/data/coding-rules.js.
 *
 * 6 steps: select focus → review issues → review suggestions
 *          → generate summary → clinician approval → complete
 */

const CODING_FOCUS_OPTIONS = [
  { id: 'full',           label: 'Full coding review',       description: 'Check all coding dimensions: completeness, specificity, medications and investigations.' },
  { id: 'completeness',   label: 'Completeness only',        description: 'Check that all conditions have ICD-10 codes.' },
  { id: 'medications',    label: 'Medication reconciliation', description: 'Check that all active medications have a matching coded indication.' },
  { id: 'investigations', label: 'Investigation alerts',     description: 'Check investigation results for uncoded or under-coded conditions.' },
];

// Module-level cache: set in render(), read in collect() of the same step.
// Safe because render always precedes collect within one step cycle.
let _findings = [];
let _summaryText = '';

function _filterFindings(allFindings, focus) {
  if (focus === 'completeness')   return allFindings.filter(f => f.type === 'missing_code');
  if (focus === 'medications')    return allFindings.filter(f => f.type === 'medication_mismatch');
  if (focus === 'investigations') return allFindings.filter(f => f.type === 'investigation_alert');
  return allFindings; // 'full'
}

function _severityBadge(severity) {
  const cls = severity === 'critical' ? 'wf-badge-critical' : severity === 'warning' ? 'wf-badge-warn' : 'wf-badge-info';
  return `<span class="wf-badge ${cls}">${severity}</span>`;
}

const CODING_STEPS = [
  // ── Step 1: Select focus ──────────────────────────────────────
  {
    id: 'select_focus',
    title: 'Select Review Focus',
    description: 'Choose which aspect of clinical coding to review.',
    render: (state) => `
      <div class="wf-section">
        <div class="wf-field-label">Review scope</div>
        ${CODING_FOCUS_OPTIONS.map(opt => `
          <label class="wf-option ${state.focus === opt.id ? 'wf-option-selected' : ''}">
            <input type="radio" name="coding-focus" value="${opt.id}" ${state.focus === opt.id ? 'checked' : ''}>
            <div>
              <strong>${opt.label}</strong>
              <div class="wf-option-desc">${opt.description}</div>
            </div>
          </label>`).join('')}
      </div>`,
    collect: () => {
      const sel = document.querySelector('input[name="coding-focus"]:checked');
      return { focus: sel ? sel.value : null };
    },
    validate: (data) => {
      if (!data.focus) return { ok: false, error: 'Please select a review scope.' };
      if (!CODING_FOCUS_OPTIONS.find(o => o.id === data.focus)) return { ok: false, error: 'Invalid review scope.' };
      return { ok: true };
    },
  },

  // ── Step 2: Review issues ─────────────────────────────────────
  {
    id: 'review_issues',
    title: 'Coding Issues Found',
    description: 'These issues were identified for this patient. No changes have been made.',
    render: (state, context) => {
      const all = analyzePatientCoding(context.patient);
      _findings = _filterFindings(all, state.focus);

      if (_findings.length === 0) {
        return `
          <div class="wf-all-clear">
            <div class="wf-all-clear-icon">✓</div>
            <p>No coding issues found for this patient with the selected review scope.</p>
            <p class="wf-ready-hint">Click Continue to proceed to the summary.</p>
          </div>`;
      }

      const critN = _findings.filter(f => f.severity === 'critical').length;
      const warnN = _findings.filter(f => f.severity === 'warning').length;
      const suggN = _findings.filter(f => f.severity === 'suggestion').length;

      return `
        <div class="wf-findings-summary">
          ${critN ? `<span class="wf-badge wf-badge-critical">${critN} critical</span>` : ''}
          ${warnN ? `<span class="wf-badge wf-badge-warn">${warnN} warning${warnN > 1 ? 's' : ''}</span>` : ''}
          ${suggN ? `<span class="wf-badge wf-badge-info">${suggN} suggestion${suggN > 1 ? 's' : ''}</span>` : ''}
        </div>
        <div class="wf-findings-list">
          ${_findings.map(f => `
            <div class="wf-finding wf-finding-${f.severity}">
              <div class="wf-finding-header">
                <span class="wf-finding-type">${f.type.replace(/_/g, ' ')}</span>
                ${_severityBadge(f.severity)}
              </div>
              <div class="wf-finding-field">${f.field}</div>
              <div class="wf-finding-desc">${f.description}</div>
            </div>`).join('')}
        </div>`;
    },
    collect: () => ({}),
  },

  // ── Step 3: Select suggestions to include ─────────────────────
  {
    id: 'review_suggestions',
    title: 'Select Suggestions',
    description: 'Uncheck any suggestions that are not applicable to this patient.',
    render: (state, context) => {
      if (!_findings.length) {
        _findings = _filterFindings(analyzePatientCoding(context.patient), state.focus);
      }
      if (_findings.length === 0) {
        return `<div class="wf-all-clear"><p>No suggestions to review — continue to generate the summary.</p></div>`;
      }
      return `
        <div class="wf-field-label">Select suggestions to include in summary</div>
        <div class="wf-findings-list">
          ${_findings.map((f, i) => `
            <label class="wf-finding wf-finding-${f.severity} wf-finding-selectable">
              <input type="checkbox" class="wf-finding-check" value="${i}" checked>
              <div class="wf-finding-inner">
                <div class="wf-finding-header">
                  <span class="wf-finding-field">${f.field}</span>
                  ${_severityBadge(f.severity)}
                </div>
                <div class="wf-finding-desc">${f.description}</div>
                <div class="wf-finding-suggestion">${f.suggestion}</div>
              </div>
            </label>`).join('')}
        </div>
        <p class="wf-section-note">These are AI-generated suggestions. Clinical judgement is required before making any record changes.</p>`;
    },
    collect: () => {
      const indices = Array.from(document.querySelectorAll('.wf-finding-check:checked'))
        .map(cb => parseInt(cb.value, 10));
      return { _acceptedIndices: indices };
    },
  },

  // ── Step 4: Generate summary ───────────────────────────────────
  {
    id: 'generate_summary',
    title: 'Generated Summary',
    description: 'AI-drafted coding review. Review all items carefully — this is not a clinical record.',
    render: (state, context) => {
      if (!_findings.length) {
        _findings = _filterFindings(analyzePatientCoding(context.patient), state.focus);
      }
      const accepted = (state._acceptedIndices || []).map(i => _findings[i]).filter(Boolean);
      _summaryText = generateCodingSummary(context.patient, accepted);
      return `
        <div class="wf-draft-label">AI-DRAFTED · UNVERIFIED</div>
        <pre class="wf-draft-content">${_summaryText}</pre>
        <p class="wf-draft-note">Review all [CLINICIAN NOTE] items before updating any clinical record.</p>`;
    },
    collect: () => ({ summaryContent: _summaryText }),
  },

  // ── Step 5: Clinician approval ─────────────────────────────────
  {
    id: 'clinician_approval',
    title: 'Clinician Approval',
    description: 'No automatic changes have been made to any clinical record.',
    render: (state, context) => `
      <div class="wf-approval-block">
        <div class="wf-approval-icon">📋</div>
        <p>By approving, you confirm that:</p>
        <ul class="wf-approval-list">
          <li>You have reviewed all identified coding issues</li>
          <li>The suggestions are clinically appropriate for this patient</li>
          <li>Any record changes will be made manually based on your clinical judgement</li>
        </ul>
        <p class="wf-approval-clinician">Approving as: <strong>${context.clinician}</strong></p>
      </div>`,
    collect: () => ({}),
  },

  // ── Step 6: Complete ───────────────────────────────────────────
  {
    id: 'complete',
    title: 'Review Complete',
    description: 'Coding review approved and summary ready to download.',
    render: (state, context) => {
      const accepted = (state._acceptedIndices || []).map(i => _findings[i]).filter(Boolean);
      return `
        <div class="wf-complete-block">
          <div class="wf-complete-icon">✓</div>
          <p>Coding review approved by <strong>${context.clinician}</strong>.</p>
          <p>${accepted.length} suggestion${accepted.length !== 1 ? 's' : ''} included in summary.</p>
          <button id="wf-download-btn" class="btn-primary wf-btn" style="width:100%;margin-top:12px">
            ⬇ Download Review Summary
          </button>
          <p class="wf-draft-note" style="margin-top:8px">No changes have been automatically applied to any clinical record.</p>
        </div>`;
    },
    collect: () => ({}),
  },
];

if (typeof module !== 'undefined') {
  module.exports = { CODING_STEPS, CODING_FOCUS_OPTIONS };
}
