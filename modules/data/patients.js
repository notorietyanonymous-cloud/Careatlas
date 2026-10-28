// Synthetic patient data — all fictional, no real clinical information.
// Mirrors the 5 test patients in the local PostgreSQL seed.

const SYNTHETIC_PATIENTS = [
  {
    id: 1,
    name: 'Margaret Chen',
    dob: '1951-03-14',
    age: 74,
    sex: 'F',
    medicare: '2145 6782 1',
    concession: true,
    atsi: false,
    interpreterNeeded: false,
    language: 'English',
    gp: 'Dr S. Moodley',
    conditions: [
      { name: 'Type 2 Diabetes Mellitus', icd10: 'E11', since: '2009', status: 'active' },
      { name: 'Hypertension', icd10: 'I10', since: '2011', status: 'active' },
      { name: 'Hypercholesterolaemia', icd10: 'E78.0', since: '2012', status: 'active' },
      { name: 'Osteoarthritis (bilateral knees)', icd10: 'M17', since: '2018', status: 'active' },
    ],
    medications: [
      { name: 'Metformin', dose: '1000mg', frequency: 'Twice daily' },
      { name: 'Perindopril', dose: '5mg', frequency: 'Once daily' },
      { name: 'Rosuvastatin', dose: '10mg', frequency: 'Once daily (night)' },
      { name: 'Paracetamol', dose: '1g', frequency: 'Up to four times daily PRN' },
    ],
    investigations: [
      { name: 'HbA1c', date: '2024-10-03', result: '8.2%', flagged: true },
      { name: 'Lipid Panel', date: '2024-10-03', result: 'LDL 2.1 mmol/L', flagged: false },
      { name: 'eGFR', date: '2024-10-03', result: '58 mL/min/1.73m²', flagged: true },
    ],
    appointments: [
      { date: '2026-11-04', type: 'CDM Review', provider: 'Dr S. Moodley' },
      { date: '2026-11-11', type: 'Podiatry', provider: 'Sarah Kim' },
    ],
    carePlan: { active: true, type: 'CDM', reviewDate: '2025-01-15' },
    ndisRelevance: {
      eligible: 'possible',
      functionalImpact: [
        'Osteoarthritis limits mobility — difficulty walking more than 100m on uneven surfaces',
        'Diabetes-related fatigue affecting daily activities',
        'Requires assistance with transport to medical appointments',
      ],
      supportingDocs: ['Specialist report from orthopaedics (2023)', 'Physiotherapy assessment (2024)'],
      missingDocs: ['Functional capacity assessment', 'OT home assessment', 'Current specialist letter'],
    },
  },
  {
    id: 2,
    name: 'James Okonkwo',
    dob: '1979-07-22',
    age: 45,
    sex: 'M',
    medicare: '2267 4519 3',
    concession: false,
    atsi: false,
    interpreterNeeded: false,
    language: 'English',
    gp: 'Dr S. Moodley',
    conditions: [
      { name: 'Hypertension', icd10: 'I10', since: '2020', status: 'active' },
      { name: 'Anxiety Disorder', icd10: 'F41.1', since: '2021', status: 'active' },
    ],
    medications: [
      { name: 'Amlodipine', dose: '5mg', frequency: 'Once daily' },
      { name: 'Sertraline', dose: '50mg', frequency: 'Once daily' },
    ],
    investigations: [
      { name: 'ECG', date: null, result: null, flagged: false, status: 'pending' },
      { name: 'Troponin', date: null, result: null, flagged: true, status: 'pending' },
    ],
    appointments: [
      { date: '2026-10-31', type: 'Acute Follow-up', provider: 'Dr S. Moodley' },
    ],
    carePlan: { active: false },
    ndisRelevance: { eligible: 'unlikely', functionalImpact: [], missingDocs: [] },
  },
  {
    id: 3,
    name: 'Sophie Nguyen',
    dob: '2016-11-30',
    age: 8,
    sex: 'F',
    medicare: '2389 1047 5',
    concession: false,
    atsi: false,
    interpreterNeeded: false,
    language: 'English',
    gp: 'Dr S. Moodley',
    conditions: [
      { name: 'Recurrent Acute Otitis Media', icd10: 'H66.0', since: '2022', status: 'active' },
      { name: 'Asthma (mild intermittent)', icd10: 'J45.2', since: '2023', status: 'active' },
    ],
    medications: [
      { name: 'Salbutamol MDI', dose: '100mcg', frequency: '2 puffs PRN' },
      { name: 'Amoxicillin', dose: '250mg/5mL', frequency: 'Three times daily' },
    ],
    investigations: [
      { name: 'Audiogram', date: null, result: null, flagged: false, status: 'pending' },
    ],
    appointments: [
      { date: '2026-11-07', type: 'ENT Referral', provider: 'Dr A. Park (ENT)' },
    ],
    carePlan: { active: false },
    ndisRelevance: { eligible: 'possible', functionalImpact: ['Hearing loss affecting school participation'], missingDocs: ['Formal audiogram', 'Paediatric assessment'] },
  },
  {
    id: 4,
    name: 'David Walsh',
    dob: '1966-05-18',
    age: 58,
    sex: 'M',
    medicare: '2451 8836 7',
    concession: true,
    atsi: false,
    interpreterNeeded: false,
    language: 'English',
    gp: 'Dr S. Moodley',
    conditions: [
      { name: 'Major Depressive Disorder', icd10: 'F32.1', since: '2018', status: 'active' },
      { name: 'Type 2 Diabetes Mellitus', icd10: 'E11', since: '2020', status: 'active' },
      { name: 'Obesity (BMI 34)', icd10: 'E66', since: '2020', status: 'active' },
    ],
    medications: [
      { name: 'Escitalopram', dose: '20mg', frequency: 'Once daily' },
      { name: 'Metformin', dose: '500mg', frequency: 'Twice daily' },
    ],
    investigations: [
      { name: 'HbA1c', date: '2024-09-17', result: '7.8%', flagged: true },
      { name: 'PHQ-9', date: '2024-10-01', result: '14 (moderate)', flagged: true },
    ],
    appointments: [
      { date: '2026-11-02', type: 'Mental Health Review', provider: 'Dr S. Moodley' },
      { date: '2026-11-09', type: 'Psychology', provider: 'Dr L. Brown' },
    ],
    carePlan: { active: true, type: 'MHCP', reviewDate: '2025-08-20' },
    ndisRelevance: {
      eligible: 'possible',
      functionalImpact: [
        'MDD causing significant impairment in work capacity and daily functioning',
        'PHQ-9 of 14 indicates moderate depression — unable to sustain employment',
        'Social withdrawal and self-care difficulties documented',
      ],
      supportingDocs: ['Psychology reports (2024)', 'Mental Health Care Plan (2024)'],
      missingDocs: ['Psychiatric assessment', 'Functional capacity report', 'Treatment history summary'],
    },
  },
  {
    id: 5,
    name: 'Anh Tran',
    dob: '1957-09-04',
    age: 67,
    sex: 'F',
    medicare: '2578 3341 9',
    concession: true,
    atsi: false,
    interpreterNeeded: true,
    language: 'Vietnamese',
    gp: 'Dr S. Moodley',
    conditions: [
      { name: 'Hypertension', icd10: 'I10', since: '2015', status: 'active' },
      { name: 'Osteoporosis', icd10: 'M81', since: '2019', status: 'active' },
      { name: 'Type 2 Diabetes Mellitus', icd10: 'E11', since: '2021', status: 'active' },
    ],
    medications: [
      { name: 'Perindopril', dose: '4mg', frequency: 'Once daily' },
      { name: 'Calcium + Vitamin D', dose: '600mg/400IU', frequency: 'Once daily' },
      { name: 'Metformin', dose: '500mg', frequency: 'Once daily' },
    ],
    investigations: [
      { name: 'DEXA Scan', date: '2024-06-12', result: 'T-score -2.8 (osteoporosis)', flagged: true },
      { name: 'HbA1c', date: null, result: null, flagged: false, status: 'pending' },
    ],
    appointments: [
      { date: '2026-10-30', type: 'Chronic Disease Review', provider: 'Dr S. Moodley', note: 'Vietnamese interpreter booked' },
    ],
    carePlan: { active: false },
    ndisRelevance: { eligible: 'unlikely', functionalImpact: [], missingDocs: [] },
  },
];

// Expose for use in modules
if (typeof module !== 'undefined') module.exports = { SYNTHETIC_PATIENTS };
