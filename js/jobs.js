let editingJobIdx = -1;
let editingJobDay = '';

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

function cycleJobStatus(dk, idx) {
  if (!canCycleStatus()) return;
  const data = getDayData(dk);
  const job = data.jobs[idx];
  if (!job) return;
  const cur = STATUS_CYCLE.indexOf(job.status || 'pending');
  job.status = STATUS_CYCLE[(cur + 1) % STATUS_CYCLE.length];
  persistState();
  render();
}

function renderJobCard(job, idx, dk) {
  const teamHtml = job.team ? escapeHtml(job.team) : '<em style="color:#666">No team</em>';
  const contactLineHtml = job.contact
    ? `<div class="job-contact-line"><span class="contact">${escapeHtml(job.contact)}</span></div>`
    : '';
  const ibBadge = job.internalBilling ? '<span class="ib-badge">IB</span>' : '';
  const ibClass = job.internalBilling ? ' internal-billing' : '';
  const status = job.status || 'pending';
  const statusLabel = STATUS_LABELS[status] || status;
  const clickable = canCycleStatus() ? ' clickable' : '';
  const statusClick = canCycleStatus() ? `onclick="cycleJobStatus('${dk}',${idx})"` : '';
  const commentCount = (job.comments || []).length;
  const commentBadge = commentCount > 0 ? `<span class="comment-badge">${commentCount}</span>` : '';
  const photoCount = (job.photos || []).length;
  const photoBadge = photoCount > 0 ? `<span class="photo-badge">${photoCount}</span>` : '';

  const customerName = job.customer ? escapeHtml(job.customer) : '';
  const customerStrong = customerName ? `<strong class="job-customer-name">${customerName}</strong>` : '';
  const addrSpan = job.address
    ? `<span class="job-address-inline">📍 ${escapeHtml(job.address)}</span>`
    : '';
  const salesSpan = job.salesman
    ? `<span class="job-salesman-inline">(${escapeHtml(job.salesman)})</span>`
    : '';
  const rowPieces = [customerStrong, addrSpan, salesSpan].filter(Boolean);
  const customerRowHtml = rowPieces.length
    ? `<div class="job-customer-row">${rowPieces.join('')}</div>`
    : '';

  return `<div class="job-card${ibClass}">
    <div class="job-num">${idx + 1}</div>
    <div class="job-body">
      <div class="job-team">${teamHtml}${ibBadge}</div>
      ${customerRowHtml}
      ${contactLineHtml}
      ${job.desc ? `<div class="job-desc">${escapeHtml(job.desc)}</div>` : ''}
      <span class="status-badge ${status}${clickable}" ${statusClick}>● ${statusLabel}</span>
    </div>
    <div class="job-actions">
      <button class="btn-edit-job" onclick="openEditJob('${dk}',${idx})" title="Edit">✏️</button>
      <button class="btn-comment" onclick="openComments('${dk}',${idx})" title="Comments">${commentBadge}💬</button>
      <button class="btn-photo" onclick="openPhotos('${dk}',${idx})" title="Photos">${photoBadge}📷</button>
      <button class="btn-edit-job" onclick="openFiles('${dk}',${idx})" title="Files">📎</button>
      <button class="btn-edit-job" onclick="openReschedule('${dk}',${idx})" title="Reschedule">📅</button>
      <button class="btn-edit-job" onclick="moveJobUp('${dk}',${idx})" title="Move Up">▲</button>
      <button class="btn-edit-job" onclick="moveJobDown('${dk}',${idx})" title="Move Down">▼</button>
      <button class="btn-edit-job" onclick="deleteJob('${dk}',${idx})" title="Delete">🗑️</button>
    </div>
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
