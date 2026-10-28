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
  navItems.forEach(n => n.classList.toggle('active', n.dataset.view === viewId));
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
document.getElementById('triage-filters').addEventListener('click', e => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;

  document.querySelectorAll('#triage-filters .filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  const filter = chip.dataset.filter;
  document.querySelectorAll('#triage-grid-live .triage-card').forEach(card => {
    switch (filter) {
      case 'all':      card.style.display = ''; break;
      case 'urgent':   card.style.display = card.classList.contains('urgent-card')   ? '' : 'none'; break;
      case 'priority': card.style.display = card.classList.contains('priority-card') ? '' : 'none'; break;
      case 'routine':  card.style.display = card.classList.contains('routine-card')  ? '' : 'none'; break;
      case 'nurse':    card.style.display = card.querySelector('.triage-assign')?.textContent.toLowerCase().includes('nurse') ? '' : 'none'; break;
      default:         card.style.display = '';
    }
  });
});

// ─── HELPERS ─────────────────────────────────────────────────
function calcAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function genderLetter(g) {
  return g === 'Female' ? 'F' : g === 'Male' ? 'M' : 'X';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── TRIAGE QUEUE (LIVE DATA) ─────────────────────────────────
async function loadTriage() {
  const grid = document.getElementById('triage-grid-live');
  if (!grid) return;

  try {
    const res = await fetch('http://localhost:3000/api/triage');
    const patients = await res.json();

    const urgentCount   = patients.filter(p => p.acuity === 'urgent').length;
    const priorityCount = patients.filter(p => p.acuity === 'priority').length;
    const routineCount  = patients.filter(p => p.acuity === 'routine').length;

    // Update header counts
    const sub = document.getElementById('triage-sub');
    if (sub) sub.innerHTML = `${patients.length} patients waiting · <strong>${urgentCount} urgent</strong> · Next available: <strong>9:40am</strong>`;

    // Update filter chip labels with live counts
    document.querySelector('[data-filter="all"]').textContent      = `All (${patients.length})`;
    document.querySelector('[data-filter="urgent"]').textContent   = `Urgent (${urgentCount})`;
    document.querySelector('[data-filter="priority"]').textContent = `Priority (${priorityCount})`;
    document.querySelector('[data-filter="routine"]').textContent  = `Routine (${routineCount})`;

    grid.innerHTML = patients.map(p => {
      const age = calcAge(p.dob);
      const sex = genderLetter(p.gender);
      const acuityClass = p.acuity === 'urgent' ? 'urgent-card' : p.acuity === 'priority' ? 'priority-card' : 'routine-card';
      const acuityBadge = p.acuity === 'urgent' ? 'acuity-urgent' : p.acuity === 'priority' ? 'acuity-priority' : 'acuity-routine';
      const acuityLetter = p.acuity === 'urgent' ? 'U' : p.acuity === 'priority' ? 'P' : 'R';
      const waitStyle = p.acuity === 'urgent' ? 'urgent-text' : '';
      const btnClass  = p.acuity === 'urgent' ? 'btn-sm btn-urgent' : 'btn-sm';

      const flags = [
        '<span class="flag flag-medicare">Medicare</span>',
        p.concession ? '<span class="flag flag-concession">Concession</span>' : '',
        p.atsi       ? '<span class="flag flag-atsi">ATSI</span>' : '',
        p.interpreter_needed ? `<span class="flag flag-interpreter">Interpreter: ${p.language}</span>` : '',
      ].filter(Boolean).join('');

      return `
        <div class="triage-card ${acuityClass}" data-patient-id="${p.patient_id}">
          <div class="triage-acuity ${acuityBadge}">${acuityLetter}</div>
          <div class="triage-info">
            <div class="triage-name">${p.first_name} ${p.last_name} <span class="triage-age">${age}${sex}</span></div>
            <div class="triage-reason">${p.reason} — arrived ${new Date(p.arrived_at).toLocaleTimeString('en-AU', {hour:'2-digit', minute:'2-digit'})}</div>
            <div class="triage-flags">${flags}</div>
          </div>
          <div class="triage-meta">
            <div class="wait-time ${waitStyle}">${p.wait_minutes} min wait</div>
            <div class="triage-assign">${p.assigned_to || 'Unassigned'}</div>
            <button class="open-patient ${btnClass}" data-id="${p.patient_id}">Open</button>
          </div>
        </div>`;
    }).join('');

    // Wire up Open buttons
    grid.querySelectorAll('.open-patient').forEach(btn => {
      btn.addEventListener('click', () => loadPatient(btn.dataset.id));
    });

  } catch (e) {
    grid.innerHTML = '<p style="color:var(--muted);padding:20px">Could not load triage queue.</p>';
  }
}

// ─── PATIENT VIEW (LIVE DATA) ─────────────────────────────────
async function loadPatient(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/patients/${id}`);
    const p = await res.json();
    const age = calcAge(p.dob);
    const sex = genderLetter(p.gender);

    // Populate patient hero stats
    document.getElementById('pt-name').textContent        = `${p.first_name} ${p.last_name}`;
    document.getElementById('pt-age').textContent         = `${age}${sex} · DOB ${formatDate(p.dob)}`;
    document.getElementById('pt-medicare').textContent    = p.medicare_number;
    document.getElementById('pt-conditions-count').textContent = p.conditions.length;
    document.getElementById('pt-meds-count').textContent  = p.medications.length;
    document.getElementById('pt-next-appt').textContent   = p.appointments.length
      ? formatDate(p.appointments[0].appointment_date)
      : 'None booked';

    // Conditions list
    const condEl = document.getElementById('pt-conditions-list');
    if (condEl) condEl.innerHTML = p.conditions.map(c => `
      <div class="condition-row">
        <div class="cond-dot" style="background:var(--teal)"></div>
        <div><strong>${c.name}</strong><br><span style="color:var(--muted);font-size:0.75rem">Diagnosed ${formatDate(c.diagnosed_date)}</span></div>
      </div>`).join('');

    // Medications list
    const medEl = document.getElementById('pt-meds-list');
    if (medEl) medEl.innerHTML = p.medications.map(m => `
      <div class="mbs-row">
        <div class="mbs-item">${m.dose}</div>
        <div class="mbs-desc">${m.name} — ${m.frequency}</div>
      </div>`).join('');

    // Investigations
    const invEl = document.getElementById('pt-investigations-list');
    if (invEl) invEl.innerHTML = p.investigations.map(i => `
      <div class="mbs-row">
        <span class="status-badge ${i.status === 'pending' ? 'pending' : 'done'}">${i.status}</span>
        <div class="mbs-desc">${i.test_name} — ordered ${formatDate(i.ordered_date)}</div>
        <div style="font-size:0.8rem;color:${i.flagged ? 'var(--red)' : 'var(--muted)'};font-weight:${i.flagged ? '600' : '400'}">${i.result || 'Pending'}</div>
      </div>`).join('');

    // Appointments
    const apptEl = document.getElementById('pt-appointments-list');
    if (apptEl) apptEl.innerHTML = p.appointments.map(a => `
      <div class="appt-card upcoming">
        <div class="appt-date">
          <div class="appt-day">${new Date(a.appointment_date).toLocaleDateString('en-AU',{weekday:'short'}).toUpperCase()}</div>
          <div class="appt-num">${new Date(a.appointment_date).getDate()}</div>
        </div>
        <div class="appt-detail">
          <div class="appt-title">${a.type}</div>
          <div class="appt-meta">${a.provider} · ${new Date(a.appointment_date).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}</div>
          ${a.notes ? `<div style="font-size:0.75rem;color:var(--muted)">${a.notes}</div>` : ''}
        </div>
      </div>`).join('') || '<p style="color:var(--muted)">No upcoming appointments.</p>';

    showView('patient-home');

  } catch(e) {
    alert('Could not load patient. Is the API running?');
  }
}

// ─── INIT ─────────────────────────────────────────────────────
showView('triage');
loadTriage();
