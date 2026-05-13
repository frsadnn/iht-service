function openAssign(key) {
  assigningReqKey = key;
  firebase.database().ref('requests/' + key).once('value').then(snap => {
    assigningReq = snap.val();
    $('assignInfo').innerHTML =
      `<strong>${escapeHtml(assigningReq.customer)}</strong>` +
      (assigningReq.contact ? `<br>📞 ${escapeHtml(assigningReq.contact)}` : '') +
      (assigningReq.address ? `<br>📍 ${escapeHtml(assigningReq.address)}` : '') +
      (assigningReq.desc ? `<br>${escapeHtml(assigningReq.desc)}` : '');
    $('assignDate').value = assigningReq.preferredDate || isoDate(new Date());
    renderAssignMemberGrid([]);
    closeModal('requestsBg');
    openModal('assignBg');
    setTimeout(() => $('assignDate').focus(), 100);
  });
}

function renderAssignMemberGrid(selected) {
  const grid = $('assignMemberGrid');
  grid.innerHTML = '';
  state.members.forEach(name => {
    const checked = selected.includes(name);
    const chip = document.createElement('label');
    chip.className = 'member-chip' + (checked ? ' checked' : '');
    chip.innerHTML = `<input type="checkbox" value="${escapeAttr(name)}" ${checked ? 'checked' : ''}> ${escapeHtml(name)}`;
    chip.querySelector('input').addEventListener('change', e => chip.classList.toggle('checked', e.target.checked));
    grid.appendChild(chip);
  });
}

function getAssignChecked() {
  return [...document.querySelectorAll('#assignMemberGrid input:checked')].map(i => i.value);
}

function confirmAssign() {
  if (!assigningReqKey || !assigningReq) return;
  const date = $('assignDate').value;
  if (!date) { showToast('Please select a date.', 'error'); return; }
  const team = getAssignChecked();

  const dayData = getDayData(date);
  dayData.jobs.push({
    team: team.join(', '),
    customer: assigningReq.customer,
    contact: assigningReq.contact || '',
    address: assigningReq.address || '',
    salesman: assigningReq.salesmanName || '',
    salesmanUid: assigningReq.submittedByUid || null,
    desc: assigningReq.desc || '',
    status: 'pending',
    comments: [],
    internalBilling: false,
    ibAmount: 0,
    photos: [],
    files: []
  });

  if (assigningReq.submittedByUid) {
    const assignLines = [
      `✅ Job Request Assigned`,
      `👤 ${assigningReq.customer}`,
      assigningReq.contact ? `📞 ${assigningReq.contact}` : null,
      assigningReq.address ? `📍 ${assigningReq.address}` : null,
      `📅 Scheduled: ${date}`,
      team.length ? `👷 Team: ${team.join(', ')}` : null
    ].filter(Boolean).join('\n');
    sendTelegramToUser(assigningReq.submittedByUid, assignLines);
  }

  firebase.database().ref('requests/' + assigningReqKey).update({
    status: 'scheduled',
    scheduledTo: date,
    scheduledTeam: team.join(', ')
  }).catch(e => console.warn('Request update failed', e));

  const [y, m, d] = date.split('-').map(Number);
  state.weekStart = isoDate(getMonday(new Date(y, m - 1, d)));
  currentDay = date;
  closeModal('assignBg');
  persistState();
  render();
}
