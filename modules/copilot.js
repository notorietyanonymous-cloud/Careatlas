/**
 * CareAtlas Copilot — Side Panel UI
 *
 * Manages the Copilot panel: patient selector, slash command input,
 * workflow rendering and audit display.
 *
 * Depends on:
 *   - WorkflowEngine  (modules/workflow-engine.js)
 *   - NDIS_STEPS      (modules/commands/ndis.js)
 *   - COMMAND_REGISTRY, getSuggestions (modules/commands/registry.js)
 *   - SYNTHETIC_PATIENTS (modules/data/patients.js)
 */

(function CareAtlasCopilot() {
  let activePatient   = null;
  let activeWorkflow  = null;
  let isOpen          = false;

  // ─── Init ─────────────────────────────────────────────────────

  function init() {
    injectPanel();
    injectToggleButton();
    bindEvents();
  }

  // ─── Panel HTML ───────────────────────────────────────────────

  function injectPanel() {
    const panel = document.createElement('div');
    panel.id = 'copilot-panel';
    panel.innerHTML = `
      <div class="copilot-header">
        <div class="copilot-title">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          CareAtlas Copilot
        </div>
        <button id="copilot-close" class="copilot-close" title="Close Copilot">✕</button>
      </div>

      <div class="copilot-patient-bar">
        <label class="copilot-patient-label">Patient context</label>
        <select id="copilot-patient-select" class="copilot-patient-select">
          <option value="">— Select patient —</option>
          ${SYNTHETIC_PATIENTS.map(p =>
            `<option value="${p.id}">${p.name} · ${p.age}${p.sex}</option>`
          ).join('')}
        </select>
      </div>

      <div class="copilot-command-bar">
        <input
          id="copilot-input"
          class="copilot-input"
          type="text"
          placeholder="Type / to see commands…"
          autocomplete="off"
        />
        <div id="copilot-suggestions" class="copilot-suggestions" style="display:none"></div>
      </div>

      <div id="copilot-body" class="copilot-body">
        <div class="copilot-empty">
          <div class="copilot-empty-icon">⌘</div>
          <p>Select a patient then type a slash command to begin.</p>
          <div class="copilot-hint-list">
            <code>/ndis</code> — NDIS documentation
            <code>/workcover</code> — WorkCover report <span class="copilot-soon">soon</span>
            <code>/referral</code> — Referral letter <span class="copilot-soon">soon</span>
          </div>
        </div>
      </div>

      <div id="copilot-audit" class="copilot-audit" style="display:none">
        <div class="copilot-audit-title">Audit trail</div>
        <div id="copilot-audit-list" class="copilot-audit-list"></div>
      </div>
    `;
    document.body.appendChild(panel);
  }

  function injectToggleButton() {
    const topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) return;

    const btn = document.createElement('button');
    btn.id = 'copilot-toggle';
    btn.className = 'copilot-toggle-btn';
    btn.title = 'Open CareAtlas Copilot';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
        <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copilot`;
    topbarRight.insertBefore(btn, topbarRight.firstChild);
  }

  // ─── Events ───────────────────────────────────────────────────

  function bindEvents() {
    document.addEventListener('click', e => {
      if (e.target.closest('#copilot-toggle')) togglePanel();
      if (e.target.closest('#copilot-close'))  closePanel();

      // Suggestion click
      const suggestion = e.target.closest('.copilot-suggestion-item');
      if (suggestion) selectSuggestion(suggestion.dataset.command);

      // Workflow navigation
      if (e.target.id === 'wf-next-btn')     advanceWorkflow();
      if (e.target.id === 'wf-back-btn')     backWorkflow();
      if (e.target.id === 'wf-cancel-btn')   cancelWorkflow();
      if (e.target.id === 'wf-download-btn') downloadDocument();
    });

    const input = () => document.getElementById('copilot-input');

    document.addEventListener('input', e => {
      if (e.target.id !== 'copilot-input') return;
      handleCommandInput(e.target.value);
    });

    document.addEventListener('keydown', e => {
      if (e.target.id !== 'copilot-input') return;
      if (e.key === 'Enter') {
        const val = input()?.value || '';
        const cmd = findCommand(val);
        if (cmd) selectSuggestion(cmd.command);
      }
      if (e.key === 'Escape') closeSuggestions();
    });

    document.getElementById('copilot-patient-select')?.addEventListener('change', e => {
      const id = parseInt(e.target.value, 10);
      activePatient = SYNTHETIC_PATIENTS.find(p => p.id === id) || null;
      if (activeWorkflow) cancelWorkflow();
      renderBody();
    });
  }

  // ─── Panel open/close ─────────────────────────────────────────

  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    isOpen = true;
    document.getElementById('copilot-panel').classList.add('open');
    document.getElementById('app').classList.add('copilot-active');
    document.getElementById('copilot-toggle').classList.add('active');
  }

  function closePanel() {
    isOpen = false;
    document.getElementById('copilot-panel').classList.remove('open');
    document.getElementById('app').classList.remove('copilot-active');
    document.getElementById('copilot-toggle').classList.remove('active');
  }

  // ─── Command input ────────────────────────────────────────────

  function handleCommandInput(value) {
    const suggestions = getSuggestions(value);
    const box = document.getElementById('copilot-suggestions');
    if (!box) return;

    if (suggestions.length === 0 || value === '') {
      box.style.display = 'none';
      return;
    }

    box.innerHTML = suggestions.map(s => `
      <div class="copilot-suggestion-item ${s.status === 'coming_soon' ? 'copilot-suggestion-soon' : ''}"
           data-command="${s.command}">
        <div class="copilot-sug-command">${s.command}</div>
        <div class="copilot-sug-desc">${s.description}</div>
        ${s.status === 'coming_soon' ? '<span class="copilot-soon">Coming soon</span>' : ''}
      </div>`).join('');
    box.style.display = 'block';
  }

  function selectSuggestion(command) {
    closeSuggestions();
    const input = document.getElementById('copilot-input');
    if (input) input.value = command;

    const cmd = findCommand(command);
    if (!cmd) return;
    if (cmd.status === 'coming_soon') {
      renderComingSoon(cmd);
      return;
    }
    if (!activePatient) {
      renderNeedPatient();
      return;
    }
    startWorkflow(cmd);
  }

  function closeSuggestions() {
    const box = document.getElementById('copilot-suggestions');
    if (box) box.style.display = 'none';
  }

  // ─── Workflow lifecycle ───────────────────────────────────────

  function startWorkflow(cmd) {
    if (cmd.module === 'ndis') {
      activeWorkflow = new WorkflowEngine('ndis', NDIS_STEPS, { patient: activePatient });
    } else if (cmd.module === 'coding') {
      activeWorkflow = new WorkflowEngine('coding', CODING_STEPS, { patient: activePatient });
    } else {
      renderComingSoon(cmd);
      return;
    }
    renderWorkflowStep();
  }

  function advanceWorkflow() {
    if (!activeWorkflow) return;

    const stepData = activeWorkflow.currentStep.collect
      ? activeWorkflow.currentStep.collect()
      : {};

    const result = activeWorkflow.advance(stepData);

    if (!result.ok) {
      showStepError(result.error);
      return;
    }

    clearStepError();

    if (result.done) {
      // Final step — trigger approval then complete
      const approval = activeWorkflow.approve();
      if (!approval.ok) { showStepError(approval.error); return; }
    }

    renderWorkflowStep();
    renderAuditTrail();
  }

  function backWorkflow() {
    if (!activeWorkflow) return;
    activeWorkflow.back();
    clearStepError();
    renderWorkflowStep();
  }

  function cancelWorkflow() {
    if (activeWorkflow) activeWorkflow.cancel('User cancelled');
    activeWorkflow = null;
    document.getElementById('copilot-input').value = '';
    renderBody();
    renderAuditTrail();
  }

  function downloadDocument() {
    const content = activeWorkflow?.state?.summaryContent || activeWorkflow?.state?.draftContent;
    if (!content) return;
    const workflowId = activeWorkflow.workflowId;
    const prefix = workflowId === 'coding' ? 'CodingReview' : 'NDIS';
    const filename = `${prefix}_${activePatient.name.replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.txt`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);

    activeWorkflow._emit('document_downloaded', { filename });
    renderAuditTrail();
  }

  // ─── Rendering ────────────────────────────────────────────────

  function renderBody() {
    const body = document.getElementById('copilot-body');
    if (!body) return;

    if (!activePatient) {
      body.innerHTML = `
        <div class="copilot-empty">
          <div class="copilot-empty-icon">⌘</div>
          <p>Select a patient then type a slash command to begin.</p>
          <div class="copilot-hint-list">
            <code>/ndis</code> — NDIS documentation
            <code>/workcover</code> — WorkCover report <span class="copilot-soon">soon</span>
            <code>/referral</code> — Referral letter <span class="copilot-soon">soon</span>
          </div>
        </div>`;
      return;
    }

    body.innerHTML = `
      <div class="copilot-ready">
        <div class="copilot-ready-patient">
          <strong>${activePatient.name}</strong> · ${activePatient.age}${activePatient.sex}
          ${activePatient.interpreterNeeded ? `<span class="wf-badge wf-badge-warn">Interpreter: ${activePatient.language}</span>` : ''}
        </div>
        <p class="copilot-ready-hint">Type a slash command above to begin.</p>
      </div>`;
  }

  function renderWorkflowStep() {
    if (!activeWorkflow) return;
    const body = document.getElementById('copilot-body');
    const step = activeWorkflow.currentStep;
    const { current, total } = activeWorkflow.progress;
    const isLast = activeWorkflow.isLastStep;
    const isComplete = activeWorkflow.status === 'approved';

    body.innerHTML = `
      <div class="wf-header">
        <div class="wf-progress">Step ${current} of ${total}</div>
        <div class="wf-progress-bar">
          <div class="wf-progress-fill" style="width:${(current/total)*100}%"></div>
        </div>
        <div class="wf-step-title">${step.title}</div>
        <div class="wf-step-desc">${step.description}</div>
      </div>

      <div id="wf-step-content" class="wf-step-content">
        ${step.render(activeWorkflow.state, activeWorkflow.context)}
      </div>

      <div id="wf-step-error" class="wf-step-error" style="display:none"></div>

      <div class="wf-nav">
        ${!activeWorkflow.isFirstStep && !isComplete
          ? `<button id="wf-back-btn" class="btn-outline wf-btn">← Back</button>`
          : '<span></span>'}
        <button id="wf-cancel-btn" class="btn-outline wf-btn wf-btn-cancel">Cancel</button>
        ${!isComplete
          ? `<button id="wf-next-btn" class="btn-primary wf-btn">
               ${isLast ? 'Approve ✓' : 'Continue →'}
             </button>`
          : ''}
      </div>`;
  }

  function renderNeedPatient() {
    const body = document.getElementById('copilot-body');
    body.innerHTML = `
      <div class="copilot-empty">
        <p>Please select a patient before running a command.</p>
      </div>`;
  }

  function renderComingSoon(cmd) {
    const body = document.getElementById('copilot-body');
    body.innerHTML = `
      <div class="copilot-empty">
        <div class="copilot-empty-icon">🔜</div>
        <p><strong>${cmd.label}</strong> is coming in a future milestone.</p>
        <p class="copilot-ready-hint">The workflow engine is built and ready — only the ${cmd.command}-specific templates need to be added.</p>
      </div>`;
  }

  function renderAuditTrail() {
    const auditEl = document.getElementById('copilot-audit');
    const listEl  = document.getElementById('copilot-audit-list');
    if (!auditEl || !listEl) return;

    const events = activeWorkflow?.getAuditTrail() || [];
    if (events.length === 0) { auditEl.style.display = 'none'; return; }

    auditEl.style.display = 'block';
    listEl.innerHTML = events.slice().reverse().map(e => `
      <div class="copilot-audit-row">
        <span class="copilot-audit-time">${new Date(e.timestamp).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
        <span class="copilot-audit-event">${formatAuditEvent(e)}</span>
      </div>`).join('');
  }

  function formatAuditEvent(e) {
    const map = {
      workflow_started:           'Workflow started',
      step_completed:             `Step completed: ${e.stepId || ''}`,
      step_entered:               `Entered step: ${e.stepId || ''}`,
      step_back:                  `Returned to step: ${e.stepId || ''}`,
      workflow_awaiting_approval: 'Awaiting clinician approval',
      clinician_approved:         `Approved by ${e.clinician || 'clinician'}`,
      workflow_cancelled:         'Workflow cancelled',
      document_downloaded:        `Document downloaded: ${e.filename || ''}`,
    };
    return map[e.eventType] || e.eventType;
  }

  function showStepError(msg) {
    const el = document.getElementById('wf-step-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

  function clearStepError() {
    const el = document.getElementById('wf-step-error');
    if (el) el.style.display = 'none';
  }

  // ─── Boot ─────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
