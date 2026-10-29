/**
 * CareAtlas — Coding Workflow Tests
 *
 * Tests coding rules, analysis functions, workflow step definitions.
 * No DOM, no AI dependency. Run with: node tests/coding.test.js
 */

const {
  applyCompletenessRules,
  applyDuplicationRules,
  applyMedicationRules,
  applySpecificityRules,
  applyInvestigationRules,
  analyzePatientCoding,
  generateCodingSummary,
  SPECIFICITY_MAP,
  MEDICATION_RULES,
} = require('../modules/data/coding-rules.js');

const { CODING_STEPS, CODING_FOCUS_OPTIONS } = require('../modules/commands/coding.js');
const { SYNTHETIC_PATIENTS } = require('../modules/data/patients.js');

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

// ─── applyCompletenessRules ───────────────────────────────────

console.log('\napplyCompletenessRules');

test('returns no findings when all conditions have ICD-10 codes', () => {
  const patient = { conditions: [{ name: 'Hypertension', icd10: 'I10', status: 'active' }] };
  const findings = applyCompletenessRules(patient);
  assertEqual(findings.length, 0);
});

test('flags condition with missing ICD-10 code', () => {
  const patient = { conditions: [{ name: 'Unknown Condition', status: 'active' }] };
  const findings = applyCompletenessRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].type, 'missing_code');
  assertEqual(findings[0].severity, 'critical');
});

test('handles patient with empty conditions array', () => {
  const findings = applyCompletenessRules({ conditions: [] });
  assertEqual(findings.length, 0);
});

// ─── applyDuplicationRules ────────────────────────────────────

console.log('\napplyDuplicationRules');

test('returns no findings when all codes are unique', () => {
  const patient = {
    conditions: [
      { name: 'T2DM', icd10: 'E11', status: 'active' },
      { name: 'Hypertension', icd10: 'I10', status: 'active' },
    ],
  };
  assertEqual(applyDuplicationRules(patient).length, 0);
});

test('flags two conditions sharing the same ICD-10 stem', () => {
  const patient = {
    conditions: [
      { name: 'T2DM', icd10: 'E11.2', status: 'active' },
      { name: 'Type 2 Diabetes', icd10: 'E11.6', status: 'active' },
    ],
  };
  const findings = applyDuplicationRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].type, 'duplicate');
  assertEqual(findings[0].severity, 'warning');
});

// ─── applyMedicationRules ─────────────────────────────────────

console.log('\napplyMedicationRules');

test('no finding when medication has matching coded condition', () => {
  const patient = {
    conditions: [{ name: 'T2DM', icd10: 'E11', status: 'active' }],
    medications: [{ name: 'Metformin 1000mg' }],
  };
  assertEqual(applyMedicationRules(patient).length, 0);
});

test('flags medication with no matching active coded condition', () => {
  const patient = {
    conditions: [{ name: 'Hypertension', icd10: 'I10', status: 'active' }],
    medications: [{ name: 'Metformin 1000mg' }],
  };
  const findings = applyMedicationRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].type, 'medication_mismatch');
  assertEqual(findings[0].severity, 'warning');
});

test('no finding for medication not in the rules list', () => {
  const patient = {
    conditions: [],
    medications: [{ name: 'Paracetamol 500mg' }],
  };
  assertEqual(applyMedicationRules(patient).length, 0);
});

test('statin matches E78 (hypercholesterolaemia) correctly', () => {
  const patient = {
    conditions: [{ name: 'Hypercholesterolaemia', icd10: 'E78.0', status: 'active' }],
    medications: [{ name: 'Rosuvastatin 10mg' }],
  };
  assertEqual(applyMedicationRules(patient).length, 0);
});

test('SSRI matches F41 anxiety correctly', () => {
  const patient = {
    conditions: [{ name: 'Anxiety', icd10: 'F41.1', status: 'active' }],
    medications: [{ name: 'Sertraline 50mg' }],
  };
  assertEqual(applyMedicationRules(patient).length, 0);
});

// ─── applySpecificityRules ────────────────────────────────────

console.log('\napplySpecificityRules');

test('flags E11 (non-specific) for specificity suggestion', () => {
  const patient = {
    conditions: [{ name: 'T2DM', icd10: 'E11', status: 'active' }],
  };
  const findings = applySpecificityRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].type, 'specificity');
  assertEqual(findings[0].severity, 'suggestion');
});

test('no specificity finding for E11.2 (already specific)', () => {
  const patient = {
    conditions: [{ name: 'T2DM with CKD', icd10: 'E11.2', status: 'active' }],
  };
  assertEqual(applySpecificityRules(patient).length, 0);
});

test('no specificity finding for codes not in SPECIFICITY_MAP', () => {
  const patient = {
    conditions: [{ name: 'Osteoarthritis', icd10: 'M17', status: 'active' }],
  };
  assertEqual(applySpecificityRules(patient).length, 0);
});

// ─── applyInvestigationRules ──────────────────────────────────

console.log('\napplyInvestigationRules');

test('flags HbA1c >= 8.0 as warning', () => {
  const patient = { investigations: [{ name: 'HbA1c', result: '8.2%' }] };
  const findings = applyInvestigationRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].severity, 'warning');
});

test('flags HbA1c >= 7.0 as suggestion', () => {
  const patient = { investigations: [{ name: 'HbA1c', result: '7.5%' }] };
  const findings = applyInvestigationRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].severity, 'suggestion');
});

test('no finding for HbA1c < 7.0', () => {
  const patient = { investigations: [{ name: 'HbA1c', result: '6.8%' }] };
  assertEqual(applyInvestigationRules(patient).length, 0);
});

test('flags eGFR < 60 as warning', () => {
  const patient = { investigations: [{ name: 'eGFR', result: '58 mL/min/1.73m²' }] };
  const findings = applyInvestigationRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].severity, 'warning');
});

test('flags eGFR < 30 as critical', () => {
  const patient = { investigations: [{ name: 'eGFR', result: '22 mL/min/1.73m²' }] };
  const findings = applyInvestigationRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].severity, 'critical');
});

test('ignores investigation with null result (pending)', () => {
  const patient = { investigations: [{ name: 'HbA1c', result: null }] };
  assertEqual(applyInvestigationRules(patient).length, 0);
});

test('flags PHQ-9 >= 10 as suggestion', () => {
  const patient = { investigations: [{ name: 'PHQ-9', result: '14 (moderate)' }] };
  const findings = applyInvestigationRules(patient);
  assertEqual(findings.length, 1);
  assertEqual(findings[0].severity, 'suggestion');
});

// ─── analyzePatientCoding (integration) ──────────────────────

console.log('\nanalyzePatientCoding — integration');

test('Margaret Chen has expected coding issues (E11 specificity, eGFR warning)', () => {
  const margaret = SYNTHETIC_PATIENTS.find(p => p.name === 'Margaret Chen');
  const findings = analyzePatientCoding(margaret);
  assert(findings.some(f => f.type === 'specificity' && f.description.includes('E11')), 'E11 specificity finding expected');
  assert(findings.some(f => f.type === 'investigation_alert' && f.field.includes('eGFR')), 'eGFR alert expected');
  assert(findings.some(f => f.type === 'investigation_alert' && f.field.includes('HbA1c')), 'HbA1c alert expected');
});

test('returns empty array for a perfectly coded patient', () => {
  const perfect = {
    conditions: [
      { name: 'Hypertension', icd10: 'I10', status: 'active' },
    ],
    medications: [
      { name: 'Perindopril 5mg' },
    ],
    investigations: [
      { name: 'ECG', result: 'Normal sinus rhythm', flagged: false },
    ],
  };
  const findings = analyzePatientCoding(perfect);
  assertEqual(findings.length, 0);
});

// ─── generateCodingSummary ────────────────────────────────────

console.log('\ngenerateCodingSummary');

test('returns a string containing the patient name', () => {
  const patient = SYNTHETIC_PATIENTS[0];
  const summary = generateCodingSummary(patient, []);
  assert(typeof summary === 'string');
  assert(summary.includes('Margaret Chen'));
});

test('includes DRAFT / UNVERIFIED label', () => {
  const summary = generateCodingSummary(SYNTHETIC_PATIENTS[0], []);
  assert(summary.includes('UNVERIFIED'));
});

test('includes accepted finding count in summary', () => {
  const patient = SYNTHETIC_PATIENTS[0];
  const findings = applyInvestigationRules(patient);
  const summary = generateCodingSummary(patient, findings);
  assert(summary.includes('ACCEPTED FINDINGS'));
});

// ─── CODING_STEPS structure ───────────────────────────────────

console.log('\nCODING_STEPS — structure');

test('CODING_STEPS is a non-empty array with 6 steps', () => {
  assert(Array.isArray(CODING_STEPS));
  assertEqual(CODING_STEPS.length, 6);
});

test('every step has id, title, render and collect', () => {
  CODING_STEPS.forEach(step => {
    assert(step.id,                           `step missing id`);
    assert(step.title,                        `step ${step.id} missing title`);
    assert(typeof step.render   === 'function', `step ${step.id} missing render`);
    assert(typeof step.collect  === 'function', `step ${step.id} missing collect`);
  });
});

test('step 1 validate rejects missing focus', () => {
  const result = CODING_STEPS[0].validate({});
  assert(!result.ok);
});

test('step 1 validate rejects unknown focus', () => {
  const result = CODING_STEPS[0].validate({ focus: 'not_valid' });
  assert(!result.ok);
});

test('step 1 validate accepts all valid focus options', () => {
  CODING_FOCUS_OPTIONS.forEach(opt => {
    const result = CODING_STEPS[0].validate({ focus: opt.id });
    assert(result.ok, `should accept focus: ${opt.id}`);
  });
});

test('CODING_FOCUS_OPTIONS has 4 entries each with id, label, description', () => {
  assertEqual(CODING_FOCUS_OPTIONS.length, 4);
  CODING_FOCUS_OPTIONS.forEach(opt => {
    assert(opt.id,          `option missing id`);
    assert(opt.label,       `option ${opt.id} missing label`);
    assert(opt.description, `option ${opt.id} missing description`);
  });
});

// ─── Summary ──────────────────────────────────────────────────

console.log(`\n${'─'.repeat(40)}`);
console.log(`Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
}
