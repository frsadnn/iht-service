let editingJobIdx = -1;
let editingJobDay = '';

const JOB_ACTION_SVG_ATTRS =
  'class="job-action-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

function jobActionIcon(inner) {
  return `<svg ${JOB_ACTION_SVG_ATTRS}>${inner}</svg>`;
}

const JOB_ACTION_ICONS = {
  edit: jobActionIcon('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'),
  comment: jobActionIcon('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'),
  photo: jobActionIcon('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
  file: jobActionIcon('<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'),
  calendar: jobActionIcon('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>'),
  chevronUp: jobActionIcon('<path d="m18 15-6-6-6 6"/>'),
  chevronDown: jobActionIcon('<path d="m6 9 6 6 6-6"/>'),
  trash: jobActionIcon('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>')
};

function openAddJob() {
  editingJobIdx = -1;
  editingJobDay = currentDay;
  $('modalTitle').textContent = 'Add Job';
  $('jobTeamGrid').innerHTML = '';
  renderJobMemberGrid([]);
  $('jobCustomer').value = '';
  $('jobContact').value = '';
  $('jobAddress').value = '';
  populateSalesmanDropdown('');
  $('jobDesc').value = '';
  $('ibToggle').classList.remove('on');
  $('ibToggle').querySelector('input').checked = false;
  $('ibAmountRow').style.display = 'none';
  $('ibAmount').value = '';
  openModal('jobModalBg');
  setTimeout(() => $('jobCustomer').focus(), 100);
}

function openEditJob(dk, idx) {
  const data = getDayData(dk);
  const job = data.jobs[idx];
  if (!job) return;
  editingJobIdx = idx;
  editingJobDay = dk;
  $('modalTitle').textContent = 'Edit Job';
  const teamArr = job.team ? job.team.split(',').map(s => s.trim()).filter(Boolean) : [];
  renderJobMemberGrid(teamArr);
  $('jobCustomer').value = job.customer || '';
  $('jobContact').value = job.contact || '';
  $('jobAddress').value = job.address || '';
  populateSalesmanDropdown(job.salesman || '');
  $('jobDesc').value = job.desc || '';

  const isIB = !!job.internalBilling;
  $('ibToggle').classList.toggle('on', isIB);
  $('ibToggle').querySelector('input').checked = isIB;
  $('ibAmountRow').style.display = isIB ? '' : 'none';
  $('ibAmount').value = job.ibAmount || '';
  openModal('jobModalBg');
}

function saveJob() {
  const team = getJobCheckedMembers().join(', ');
  const customer = $('jobCustomer').value.trim();
  const contact = $('jobContact').value.trim();
  const address = $('jobAddress').value.trim();
  const salesman = $('jobSalesman').value.trim();
  const desc = $('jobDesc').value.trim();
  const isIB = $('ibToggle').querySelector('input').checked;
  const ibAmount = parseFloat($('ibAmount').value) || 0;

  if (!customer && !team) {
    showToast('Please enter at least a customer or team.', 'error');
    return;
  }

  const data = getDayData(editingJobDay);
  if (editingJobIdx >= 0) {
    const job = data.jobs[editingJobIdx];
    job.team = team;
    job.customer = customer;
    job.contact = contact;
    job.address = address;
    job.salesman = salesman;
    job.desc = desc;
    job.internalBilling = isIB;
    job.ibAmount = ibAmount;
  } else {
    data.jobs.push({
      team, customer, contact, address, salesman, desc,
      salesmanUid: null,
      status: 'pending',
      comments: [],
      internalBilling: isIB,
      ibAmount: ibAmount,
      ibComment: '',
      photos: [],
      files: []
    });
  }

  closeModal('jobModalBg');
  persistState();
  render();
}

function deleteJob(dk, idx) {
  if (!confirm('Delete this job?')) return;
  const data = getDayData(dk);
  data.jobs.splice(idx, 1);
  persistState();
  render();
}

function moveJobUp(dk, idx) {
  if (idx <= 0) return;
  const data = getDayData(dk);
  [data.jobs[idx - 1], data.jobs[idx]] = [data.jobs[idx], data.jobs[idx - 1]];
  persistState();
  render();
}

function moveJobDown(dk, idx) {
  const data = getDayData(dk);
  if (idx >= data.jobs.length - 1) return;
  [data.jobs[idx], data.jobs[idx + 1]] = [data.jobs[idx + 1], data.jobs[idx]];
  persistState();
  render();
}

function setJobStatus(dk, idx, newStatus) {
  if (!canCycleStatus()) return;
  if (!STATUS_CYCLE.includes(newStatus)) return;
  const data = getDayData(dk);
  const job = data.jobs[idx];
  if (!job) return;
  if ((job.status || 'pending') === newStatus) return;
  job.status = newStatus;
  persistState();
  render();
}

function renderJobStatusControl(job, idx, dk) {
  const status = job.status || 'pending';
  const statusLabel = STATUS_LABELS[status] || status;
  if (!canCycleStatus()) {
    return `<span class="status-badge ${status}">● ${statusLabel}</span>`;
  }
  const options = STATUS_CYCLE.map(s =>
    `<option value="${s}"${s === status ? ' selected' : ''}>${STATUS_LABELS[s]}</option>`
  ).join('');
  return `<select class="job-status-select status-${status}" aria-label="Job status"
    onchange="setJobStatus('${dk}',${idx}, this.value)">${options}</select>`;
}

function renderJobCard(job, idx, dk) {
  const teamHtml = job.team ? escapeHtml(job.team) : '<em style="color:#666">No team</em>';
  const contactLineHtml = job.contact
    ? `<div class="job-contact-line"><span class="contact">${escapeHtml(job.contact)}</span></div>`
    : '';
  const ibBadge = job.internalBilling ? '<span class="ib-badge">IB</span>' : '';
  const ibClass = job.internalBilling ? ' internal-billing' : '';
  const commentCount = (job.comments || []).length;
  const commentBadge = commentCount > 0 ? `<span class="comment-badge">${commentCount}</span>` : '';
  const photoCount = (job.photos || []).length;
  const photoBadge = photoCount > 0 ? `<span class="photo-badge">${photoCount}</span>` : '';

  const customerName = job.customer ? escapeHtml(job.customer) : '';
  const customerStrong = customerName ? `<strong class="job-customer-name">${customerName}</strong>` : '';
  let customerSectionHtml = '';
  if (customerStrong || job.address) {
    customerSectionHtml = '<div class="job-customer-block">';
    if (customerStrong) {
      customerSectionHtml += `<div class="job-customer-row">${customerStrong}</div>`;
    }
    if (job.address) {
      customerSectionHtml += `<div class="job-address-line">📍 ${escapeHtml(job.address)}</div>`;
    }
    customerSectionHtml += '</div>';
  }
  const salesCornerHtml = job.salesman
    ? `<div class="job-salesman-corner">(${escapeHtml(job.salesman)})</div>`
    : '';

  return `<div class="job-card${ibClass}">
    <div class="job-num">${idx + 1}</div>
    <div class="job-body">
      <div class="job-team">${teamHtml}${ibBadge}</div>
      ${customerSectionHtml}
      ${contactLineHtml}
      ${job.desc ? `<div class="job-desc">${escapeHtml(job.desc)}</div>` : ''}
      ${renderJobStatusControl(job, idx, dk)}
    </div>
    <div class="job-actions">
      <button type="button" class="btn-edit-job" onclick="openEditJob('${dk}',${idx})" title="Edit">${JOB_ACTION_ICONS.edit}</button>
      <button type="button" class="btn-comment" onclick="openComments('${dk}',${idx})" title="Comments">${commentBadge}${JOB_ACTION_ICONS.comment}</button>
      <button type="button" class="btn-photo" onclick="openPhotos('${dk}',${idx})" title="Photos">${photoBadge}${JOB_ACTION_ICONS.photo}</button>
      <button type="button" class="btn-edit-job" onclick="openFiles('${dk}',${idx})" title="Files">${JOB_ACTION_ICONS.file}</button>
      <button type="button" class="btn-edit-job" onclick="openReschedule('${dk}',${idx})" title="Reschedule">${JOB_ACTION_ICONS.calendar}</button>
      <button type="button" class="btn-edit-job" onclick="moveJobUp('${dk}',${idx})" title="Move Up">${JOB_ACTION_ICONS.chevronUp}</button>
      <button type="button" class="btn-edit-job" onclick="moveJobDown('${dk}',${idx})" title="Move Down">${JOB_ACTION_ICONS.chevronDown}</button>
      <button type="button" class="btn-edit-job btn-delete-job" onclick="deleteJob('${dk}',${idx})" title="Delete">${JOB_ACTION_ICONS.trash}</button>
    </div>
    ${salesCornerHtml}
  </div>`;
}

function renderJobMemberGrid(selected) {
  const grid = $('jobTeamGrid');
  grid.innerHTML = '';
  const data = getDayData(currentDay);
  const absences = data.absences || {};

  state.members.forEach(name => {
    const checked = selected.includes(name);
    const isAbsent = !!absences[name];
    const otherJobsToday = getDayData(editingJobDay || currentDay).jobs.some((j, jIdx) => {
      if (jIdx === editingJobIdx) return false;
      return j.team && j.team.split(',').map(s => s.trim()).includes(name);
    });
    let cls = 'member-chip';
    if (checked) cls += ' checked';
    if (isAbsent) cls += ' absent';
    else if (otherJobsToday && !checked) cls += ' assigned';

    const chip = document.createElement('label');
    chip.className = cls;
    chip.innerHTML = `<input type="checkbox" value="${escapeAttr(name)}" ${checked ? 'checked' : ''} ${isAbsent ? 'disabled' : ''}> ${escapeHtml(name)}`;
    chip.querySelector('input').addEventListener('change', e => {
      chip.classList.toggle('checked', e.target.checked);
    });
    grid.appendChild(chip);
  });
}

function getJobCheckedMembers() {
  return [...document.querySelectorAll('#jobTeamGrid input:checked')].map(i => i.value);
}

function handleIBChange(cb) {
  cb.closest('.ib-toggle').classList.toggle('on', cb.checked);
  $('ibAmountRow').style.display = cb.checked ? '' : 'none';
}

// Reschedule
function openReschedule(dk, idx) {
  $('reschedDate').value = dk;
  $('reschedDate').dataset.sourceDk = dk;
  $('reschedDate').dataset.sourceIdx = idx;
  openModal('rescheduleBg');
}

function confirmReschedule() {
  const newDate = $('reschedDate').value;
  const sourceDk = $('reschedDate').dataset.sourceDk;
  const sourceIdx = parseInt($('reschedDate').dataset.sourceIdx);
  if (!newDate || newDate === sourceDk) { closeModal('rescheduleBg'); return; }

  const srcData = getDayData(sourceDk);
  const job = srcData.jobs.splice(sourceIdx, 1)[0];
  if (!job) return;

  const destData = getDayData(newDate);
  destData.jobs.push(job);

  const [y, m, d] = newDate.split('-').map(Number);
  state.weekStart = isoDate(getMonday(new Date(y, m - 1, d)));
  currentDay = newDate;

  closeModal('rescheduleBg');
  persistState();
  render();
}

function deleteWeek() {
  if (!confirm('Delete all jobs for this week? This cannot be undone.')) return;
  DAYS.forEach((_, i) => {
    const dk = dayKey(state.weekStart, i);
    if (state.schedule[dk]) {
      state.schedule[dk].jobs = [];
    }
  });
  persistState();
  render();
}
