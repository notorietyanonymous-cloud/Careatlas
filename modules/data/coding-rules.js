// Clinical coding rules for CareAtlas /coding workflow.
// Pure data + analysis functions — no DOM, no AI provider dependency.

// ICD-10 stems that benefit from specificity sub-coding
const SPECIFICITY_MAP = {
  E11: {
    name: 'Type 2 Diabetes Mellitus',
    note: 'Consider specifying end-organ involvement: E11.2 (CKD), E11.3 (retinopathy), E11.4 (neuropathy), E11.6 (other specified complications)',
  },
  F32: {
    name: 'Depressive Episode',
    note: 'Consider specifying severity: F32.0 (mild), F32.1 (moderate), F32.2 (severe without psychotic symptoms)',
  },
  F41: {
    name: 'Anxiety Disorders',
    note: 'Consider specifying type: F41.0 (panic), F41.1 (GAD), F41.2 (mixed anxiety and depression)',
  },
};

// Medication name (first word) → expected active ICD-10 stem(s)
const MEDICATION_RULES = [
  {
    pattern: /^(metformin|sitagliptin|empagliflozin|dapagliflozin|semaglutide|gliclazide|glipizide|insulin)$/i,
    expectedPrefixes: ['E11', 'E10', 'E13'],
    label: 'Diabetes medication',
  },
  {
    pattern: /^(sertraline|fluoxetine|escitalopram|venlafaxine|desvenlafaxine|mirtazapine|duloxetine|paroxetine)$/i,
    expectedPrefixes: ['F32', 'F33', 'F40', 'F41'],
    label: 'Antidepressant / anxiolytic',
  },
  {
    pattern: /^(perindopril|ramipril|lisinopril|amlodipine|metoprolol|bisoprolol|irbesartan|telmisartan|valsartan|candesartan)$/i,
    expectedPrefixes: ['I10', 'I11', 'I20', 'I25', 'I50'],
    label: 'Antihypertensive / cardiac medication',
  },
  {
    pattern: /^(rosuvastatin|atorvastatin|pravastatin|simvastatin)$/i,
    expectedPrefixes: ['E78', 'I25'],
    label: 'Statin (lipid-lowering)',
  },
  {
    pattern: /^(salbutamol|salmeterol|budesonide|fluticasone|beclomethasone|montelukast|tiotropium|ipratropium)$/i,
    expectedPrefixes: ['J45', 'J44'],
    label: 'Respiratory medication',
  },
  {
    pattern: /^(alendronate|risedronate|zoledronic|denosumab)$/i,
    expectedPrefixes: ['M81', 'M80'],
    label: 'Bone-modifying agent (osteoporosis)',
  },
];

// Investigation name → result interpretation → coding alert
const INVESTIGATION_RULES = [
  {
    name: 'HbA1c',
    check: (result) => {
      const val = parseFloat(result);
      if (isNaN(val)) return null;
      if (val >= 8.0) return { severity: 'warning',    message: `HbA1c ${result} — poor control. If end-organ complications are present, consider upgrading E11 to E11.2x/E11.3x/E11.4x/E11.6x.` };
      if (val >= 7.0) return { severity: 'suggestion', message: `HbA1c ${result} — above target. Ensure diabetes coding reflects current management complexity.` };
      return null;
    },
  },
  {
    name: 'eGFR',
    check: (result) => {
      const val = parseInt(result, 10);
      if (isNaN(val)) return null;
      if (val < 30) return { severity: 'critical',    message: `eGFR ${result} — CKD Stage 4-5. Consider adding N18.4/N18.5 and E11.22 (T2DM with CKD) if applicable.` };
      if (val < 60) return { severity: 'warning',     message: `eGFR ${result} — CKD Stage 3. Consider adding N18.3 and reviewing diabetes coding for nephropathy (E11.22).` };
      return null;
    },
  },
  {
    name: 'PHQ-9',
    check: (result) => {
      const val = parseInt(result, 10);
      if (isNaN(val)) return null;
      if (val >= 20) return { severity: 'warning',    message: `PHQ-9 ${result} (severe). Confirm coding is F32.2 (severe) — not F32.1 (moderate).` };
      if (val >= 10) return { severity: 'suggestion', message: `PHQ-9 ${result} (moderate). Confirm depression severity coding matches score (F32.1).` };
      return null;
    },
  },
  {
    name: 'DEXA Scan',
    check: (result) => {
      if (result && /osteoporosis/i.test(result)) {
        return { severity: 'suggestion', message: `DEXA confirms osteoporosis — ensure M81 (without fracture) or M80 (with fracture) is coded and current.` };
      }
      return null;
    },
  },
];

// ─── Analysis functions ────────────────────────────────────────

function applyCompletenessRules(patient) {
  const findings = [];
  (patient.conditions || []).forEach(c => {
    if (!c.icd10) {
      findings.push({
        type: 'missing_code',
        severity: 'critical',
        field: `conditions: ${c.name}`,
        description: `"${c.name}" has no ICD-10 code.`,
        suggestion: 'Assign an appropriate ICD-10 code before this record is submitted.',
      });
    }
  });
  return findings;
}

function applyDuplicationRules(patient) {
  const findings = [];
  const seen = {};
  (patient.conditions || []).forEach(c => {
    const stem = (c.icd10 || '').split('.')[0];
    if (!stem) return;
    if (seen[stem]) {
      findings.push({
        type: 'duplicate',
        severity: 'warning',
        field: `conditions: ${c.name}`,
        description: `Possible duplicate: "${c.name}" (${c.icd10}) and "${seen[stem]}" share ICD-10 stem ${stem}.`,
        suggestion: 'Review whether both entries are needed or should be merged into one coded condition.',
      });
    } else {
      seen[stem] = c.name;
    }
  });
  return findings;
}

function applyMedicationRules(patient) {
  const findings = [];
  const activeStems = (patient.conditions || [])
    .filter(c => c.icd10 && c.status === 'active')
    .map(c => c.icd10.split('.')[0]);

  (patient.medications || []).forEach(med => {
    const firstWord = (med.name || '').split(/[\s(]/)[0];
    for (const rule of MEDICATION_RULES) {
      if (rule.pattern.test(firstWord)) {
        const matched = rule.expectedPrefixes.some(p => activeStems.some(s => s.startsWith(p)));
        if (!matched) {
          findings.push({
            type: 'medication_mismatch',
            severity: 'warning',
            field: `medications: ${med.name}`,
            description: `${med.name} (${rule.label}) — no matching active coded condition found (expected ${rule.expectedPrefixes.join('/')}).`,
            suggestion: `Ensure the indication is coded. Expected ICD-10 prefix(es): ${rule.expectedPrefixes.join(', ')}.`,
          });
        }
        break;
      }
    }
  });
  return findings;
}

function applySpecificityRules(patient) {
  const findings = [];
  (patient.conditions || []).forEach(c => {
    if (!c.icd10) return;
    const stem = c.icd10.split('.')[0];
    const rule = SPECIFICITY_MAP[stem];
    if (rule && !c.icd10.includes('.')) {
      findings.push({
        type: 'specificity',
        severity: 'suggestion',
        field: `conditions: ${c.name}`,
        description: `"${c.name}" coded as ${c.icd10} — non-specific.`,
        suggestion: rule.note,
      });
    }
  });
  return findings;
}

function applyInvestigationRules(patient) {
  const findings = [];
  (patient.investigations || []).forEach(inv => {
    if (!inv.result) return;
    const rule = INVESTIGATION_RULES.find(r => r.name === inv.name);
    if (!rule) return;
    const finding = rule.check(inv.result);
    if (finding) {
      findings.push({
        type: 'investigation_alert',
        severity: finding.severity,
        field: `investigations: ${inv.name} (${inv.result})`,
        description: finding.message,
        suggestion: '[CLINICIAN NOTE: Review and update coding if clinically appropriate]',
      });
    }
  });
  return findings;
}

function analyzePatientCoding(patient) {
  return [
    ...applyCompletenessRules(patient),
    ...applyDuplicationRules(patient),
    ...applyMedicationRules(patient),
    ...applySpecificityRules(patient),
    ...applyInvestigationRules(patient),
  ];
}

function generateCodingSummary(patient, acceptedFindings) {
  const date = new Date().toLocaleDateString('en-AU');
  const clinician = 'Dr S. Moodley';
  const critCount = acceptedFindings.filter(f => f.severity === 'critical').length;
  const warnCount = acceptedFindings.filter(f => f.severity === 'warning').length;
  const suggCount = acceptedFindings.filter(f => f.severity === 'suggestion').length;

  const lines = [
    'CLINICAL CODING REVIEW — AI-DRAFTED · UNVERIFIED',
    '',
    `Patient:   ${patient.name}  DOB: ${patient.dob}  Medicare: ${patient.medicare}`,
    `Clinician: ${clinician}`,
    `Date:      ${date}`,
    '',
    'SUMMARY',
    '─────────────────────────────────────────────',
    `Critical issues:  ${critCount}`,
    `Warnings:         ${warnCount}`,
    `Suggestions:      ${suggCount}`,
    '',
    'ACCEPTED FINDINGS',
    '─────────────────────────────────────────────',
  ];

  if (acceptedFindings.length === 0) {
    lines.push('No changes accepted.');
  } else {
    acceptedFindings.forEach((f, i) => {
      lines.push(`${i + 1}. [${f.severity.toUpperCase()}] ${f.field}`);
      lines.push(`   Issue:      ${f.description}`);
      lines.push(`   Suggestion: ${f.suggestion}`);
      lines.push('');
    });
  }

  lines.push('─────────────────────────────────────────────');
  lines.push('This summary is AI-generated and requires clinician review before any record changes are made.');
  lines.push(`Approved by: ${clinician}  |  ${date}`);

  return lines.join('\n');
}

if (typeof module !== 'undefined') {
  module.exports = {
    SPECIFICITY_MAP,
    MEDICATION_RULES,
    INVESTIGATION_RULES,
    applyCompletenessRules,
    applyDuplicationRules,
    applyMedicationRules,
    applySpecificityRules,
    applyInvestigationRules,
    analyzePatientCoding,
    generateCodingSummary,
  };
}
