/**
 * CareAtlas — Workflow Engine Tests
 *
 * Tests the state machine logic for the workflow engine and /ndis
 * workflow definitions. These test business logic, not the UI.
 *
 * Run with: node tests/workflow.test.js
 * No test framework dependency — plain Node.js.
 */

const { WorkflowEngine } = require('../modules/workflow-engine.js');
const { NDIS_STEPS, NDIS_PURPOSES, buildWarnings, generateNDISDraft } = require('../modules/commands/ndis.js');
const { SYNTHETIC_PATIENTS }  = require('../modules/data/patients.js');
const { COMMAND_REGISTRY, findCommand, getSuggestions } = require('../modules/commands/registry.js');

// ─── Minimal test runner ──────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✕ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, message) {
  if (a !== b) throw new Error(message || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ─── WorkflowEngine tests ─────────────────────────────────────

console.log('\nWorkflowEngine — state machine');

test('initialises with correct state', () => {
  const patient = SYNTHETIC_PATIENTS[0];
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient });
  assertEqual(engine.status, 'in_progress');
  assertEqual(engine.currentIndex, 0);
  assert(engine.isFirstStep, 'should be at first step');
  assert(!engine.isLastStep, 'should not be at last step');
});

test('emits workflow_started audit event on creation', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  const events = engine.getAuditTrail();
  assert(events.length > 0, 'should have audit events');
  assertEqual(events[0].eventType, 'workflow_started');
});

test('advance fails validation when required data missing', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  const result = engine.advance({});  // no purpose selected
  assert(!result.ok, 'should fail without purpose');
  assert(result.error, 'should have error message');
  assertEqual(engine.currentIndex, 0, 'should not have advanced');
});

test('advance succeeds with valid data and moves to next step', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  const result = engine.advance({ purpose: 'access' });
  assert(result.ok, 'should succeed');
  assertEqual(engine.currentIndex, 1, 'should advance to step 2');
  assertEqual(engine.state.purpose, 'access', 'should persist state');
});

test('back() returns to previous step', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  engine.advance({ purpose: 'access' });
  assertEqual(engine.currentIndex, 1);
  engine.back();
  assertEqual(engine.currentIndex, 0);
});

test('back() does nothing on first step', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  engine.back();
  assertEqual(engine.currentIndex, 0, 'should stay at step 0');
});

test('approve() fails when not awaiting approval', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  const result = engine.approve();
  assert(!result.ok, 'should fail — not yet at approval stage');
});

test('state persists across multiple step advances', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  engine.advance({ purpose: 'functional' });
  engine.advance({});
  engine.advance({});
  assertEqual(engine.state.purpose, 'functional', 'state should persist through steps');
});

test('cancel() sets status to cancelled and emits event', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  engine.cancel('user request');
  assertEqual(engine.status, 'cancelled');
  const events = engine.getAuditTrail();
  assert(events.some(e => e.eventType === 'workflow_cancelled'), 'should have cancel event');
});

test('progress returns correct current/total', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  const p = engine.progress;
  assertEqual(p.current, 1);
  assertEqual(p.total, NDIS_STEPS.length);
});

test('toJSON() returns serialisable snapshot', () => {
  const engine = new WorkflowEngine('ndis', NDIS_STEPS, { patient: SYNTHETIC_PATIENTS[0] });
  engine.advance({ purpose: 'access' });
  const json = engine.toJSON();
  assertEqual(json.workflowId, 'ndis');
  assertEqual(json.currentIndex, 1);
  assert(json.auditEvents.length > 0);
});

// ─── /ndis workflow tests ─────────────────────────────────────

console.log('\n/ndis — workflow definitions');

test('NDIS_STEPS is a non-empty array', () => {
  assert(Array.isArray(NDIS_STEPS), 'should be array');
  assert(NDIS_STEPS.length >= 6, 'should have at least 6 steps');
});

test('every step has id, title, render and collect', () => {
  NDIS_STEPS.forEach(step => {
    assert(step.id,      `step missing id`);
    assert(step.title,   `step ${step.id} missing title`);
    assert(typeof step.render   === 'function', `step ${step.id} missing render`);
    assert(typeof step.collect  === 'function', `step ${step.id} missing collect`);
  });
});

test('step 1 validate rejects missing purpose', () => {
  const result = NDIS_STEPS[0].validate({});
  assert(!result.ok, 'should reject empty data');
});

test('step 1 validate rejects invalid purpose', () => {
  const result = NDIS_STEPS[0].validate({ purpose: 'not_a_real_purpose' });
  assert(!result.ok, 'should reject unknown purpose');
});

test('step 1 validate accepts valid purpose', () => {
  NDIS_PURPOSES.forEach(p => {
    const result = NDIS_STEPS[0].validate({ purpose: p.id });
    assert(result.ok, `should accept purpose: ${p.id}`);
  });
});

test('buildWarnings returns critical warning for patient with no conditions', () => {
  const emptyPatient = { conditions: [], investigations: [], ndisRelevance: {} };
  const warnings = buildWarnings(emptyPatient, { purpose: 'access' });
  assert(warnings.some(w => w.severity === 'critical'), 'should flag missing diagnoses');
});

test('buildWarnings returns eligibility warning for unlikely patient', () => {
  const patient = { ...SYNTHETIC_PATIENTS[1] }; // James — unlikely
  const warnings = buildWarnings(patient, { purpose: 'access' });
  assert(warnings.some(w => w.label.toLowerCase().includes('eligib')), 'should flag eligibility concern');
});

test('generateNDISDraft returns string with patient name', () => {
  const patient = SYNTHETIC_PATIENTS[0]; // Margaret
  const draft = generateNDISDraft(patient, { purpose: 'access' });
  assert(typeof draft === 'string', 'should return string');
  assert(draft.includes('Margaret Chen'), 'should include patient name');
  assert(draft.includes('DRAFT'), 'should include draft warning');
});

test('generateNDISDraft includes missing items as placeholders', () => {
  const patient = SYNTHETIC_PATIENTS[0]; // has missing docs
  const draft = generateNDISDraft(patient, { purpose: 'access' });
  assert(draft.includes('CLINICIAN NOTE'), 'should note missing items');
});

// ─── Command Registry tests ───────────────────────────────────

console.log('\nCommand Registry');

test('findCommand returns /ndis for exact match', () => {
  const cmd = findCommand('/ndis');
  assert(cmd, 'should find /ndis');
  assertEqual(cmd.module, 'ndis');
});

test('findCommand returns null for unknown command', () => {
  const cmd = findCommand('/doesnotexist');
  assert(!cmd, 'should return null');
});

test('getSuggestions returns results for partial /n', () => {
  const results = getSuggestions('/n');
  assert(results.length > 0, 'should return suggestions');
  assert(results.some(r => r.command === '/ndis'), 'should include /ndis');
});

test('getSuggestions returns empty for non-slash input', () => {
  const results = getSuggestions('ndis');
  assertEqual(results.length, 0, 'should not suggest without /');
});

test('all commands in registry have required fields', () => {
  COMMAND_REGISTRY.forEach(cmd => {
    assert(cmd.command,     `command missing command field`);
    assert(cmd.label,       `command ${cmd.command} missing label`);
    assert(cmd.description, `command ${cmd.command} missing description`);
    assert(cmd.module,      `command ${cmd.command} missing module`);
    assert(cmd.status,      `command ${cmd.command} missing status`);
  });
});

// ─── Synthetic patient data tests ────────────────────────────

console.log('\nSynthetic Patient Data');

test('5 synthetic patients are defined', () => {
  assertEqual(SYNTHETIC_PATIENTS.length, 5);
});

test('all patients have required fields', () => {
  SYNTHETIC_PATIENTS.forEach(p => {
    assert(p.id,       `patient missing id`);
    assert(p.name,     `patient ${p.id} missing name`);
    assert(p.dob,      `patient ${p.id} missing dob`);
    assert(p.medicare, `patient ${p.id} missing medicare`);
    assert(Array.isArray(p.conditions),  `patient ${p.id} conditions should be array`);
    assert(Array.isArray(p.medications), `patient ${p.id} medications should be array`);
  });
});

test('Medicare numbers in test range (start with 2)', () => {
  SYNTHETIC_PATIENTS.forEach(p => {
    assert(p.medicare.startsWith('2'), `patient ${p.name} medicare should start with 2`);
  });
});

// ─── Summary ──────────────────────────────────────────────────

console.log(`\n${'─'.repeat(40)}`);
console.log(`Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log(`\nAll tests passed.`);
}
