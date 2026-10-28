/**
 * CareAtlas Workflow Engine
 *
 * A reusable state machine for clinical document workflows.
 * Used by /ndis, /workcover, /referral etc. — each workflow
 * provides its own step definitions; this engine manages state,
 * transitions, validation and audit events.
 *
 * No AI provider dependency. No framework dependency.
 */

class WorkflowEngine {
  /**
   * @param {string} workflowId  - e.g. 'ndis'
   * @param {Array}  steps       - ordered step definitions (see ndis.js)
   * @param {Object} context     - initial context (patient, clinician, etc.)
   */
  constructor(workflowId, steps, context = {}) {
    this.workflowId   = workflowId;
    this.steps        = steps;
    this.currentIndex = 0;
    this.state        = {};          // persisted data across steps
    this.auditEvents  = [];
    this.status       = 'in_progress'; // in_progress | approved | cancelled

    this.context = {
      clinician: 'Dr S. Moodley',
      timestamp: new Date().toISOString(),
      ...context,
    };

    this._emit('workflow_started', { workflowId, patientId: context.patient?.id });
  }

  // ─── Accessors ───────────────────────────────────────────────

  get currentStep() {
    return this.steps[this.currentIndex];
  }

  get isFirstStep() {
    return this.currentIndex === 0;
  }

  get isLastStep() {
    return this.currentIndex === this.steps.length - 1;
  }

  get progress() {
    return { current: this.currentIndex + 1, total: this.steps.length };
  }

  // ─── Navigation ──────────────────────────────────────────────

  /**
   * Advance to next step.
   * @param {Object} stepData - data collected in current step
   * @returns {{ ok: boolean, error?: string }}
   */
  advance(stepData = {}) {
    const step = this.currentStep;

    if (step.validate) {
      const result = step.validate(stepData, this.state, this.context);
      if (!result.ok) return result;
    }

    // Persist step data
    this.state = { ...this.state, ...stepData };
    this._emit('step_completed', { stepId: step.id, data: stepData });

    if (this.isLastStep) {
      this.status = 'awaiting_approval';
      this._emit('workflow_awaiting_approval', {});
      return { ok: true, done: true };
    }

    this.currentIndex++;
    this._emit('step_entered', { stepId: this.currentStep.id });
    return { ok: true, done: false };
  }

  back() {
    if (this.isFirstStep) return;
    this.currentIndex--;
    this._emit('step_back', { stepId: this.currentStep.id });
  }

  /**
   * Clinician approves the completed workflow.
   */
  approve(approvalNote = '') {
    if (this.status !== 'awaiting_approval') {
      return { ok: false, error: 'Workflow is not ready for approval.' };
    }
    this.status = 'approved';
    this._emit('clinician_approved', {
      clinician: this.context.clinician,
      note: approvalNote,
      timestamp: new Date().toISOString(),
    });
    return { ok: true };
  }

  cancel(reason = '') {
    this.status = 'cancelled';
    this._emit('workflow_cancelled', { reason });
  }

  // ─── Audit ───────────────────────────────────────────────────

  _emit(eventType, data) {
    this.auditEvents.push({
      eventType,
      timestamp: new Date().toISOString(),
      workflowId: this.workflowId,
      ...data,
    });
  }

  getAuditTrail() {
    return [...this.auditEvents];
  }

  // ─── Serialisation (for persistence / test inspection) ───────

  toJSON() {
    return {
      workflowId:   this.workflowId,
      status:       this.status,
      currentIndex: this.currentIndex,
      state:        this.state,
      context:      this.context,
      auditEvents:  this.auditEvents,
    };
  }
}

if (typeof module !== 'undefined') module.exports = { WorkflowEngine };
