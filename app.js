// ─── VIEW ROUTING ────────────────────────────────────────────
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const breadcrumb = document.getElementById('breadcrumb');

const breadcrumbs = {
  'triage':              'Practice · Triage Queue',
  'practice-dashboard':  'Practice · Dashboard',
  'medicare':            'Practice · Medicare Intelligence',
  'preventative':        'Practice · Preventative Care',
  'licence':             'Practice · Licence Allocator',
  'patient-home':        'Patient · My Health',
  'appointments':        'Patient · Appointments',
  'investigations':      'Patient · Investigations',
  'care-plan':           'Patient · Care Plan',
  'health-info':         'Patient · Health Information',
  'neighbourhood-map':   'Neighbourhood · Health Map',
  'referral-network':    'Neighbourhood · Referral Network',
  'allied-health':       'Neighbourhood · Allied Health',
  'social':              'Neighbourhood · Social Determinants',
};

function showView(viewId) {
  views.forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');

  navItems.forEach(n => {
    n.classList.toggle('active', n.dataset.view === viewId);
  });

  breadcrumb.textContent = breadcrumbs[viewId] || 'CareAtlas';
  window.scrollTo(0, 0);
}

navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    showView(item.dataset.view);
  });
});

// ─── TRIAGE FILTERS ───────────────────────────────────────────
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

// ─── INIT ─────────────────────────────────────────────────────
showView('triage');
