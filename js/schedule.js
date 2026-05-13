function navigateWeek(offset) {
  const [y, m, d] = state.weekStart.split('-').map(Number);
  const mon = new Date(y, m - 1, d + (offset * 7));
  state.weekStart = isoDate(mon);
  currentDay = dayKey(state.weekStart, 0);
  render();
}

function goToToday() {
  state.weekStart = isoDate(getMonday(new Date()));
  const todayStr = isoDate(new Date());
  const todayDow = new Date().getDay();
  if (todayDow >= 1 && todayDow <= 6) {
    currentDay = todayStr;
  } else {
    currentDay = dayKey(state.weekStart, 0);
  }
  render();
}

function switchDay(dk) {
  currentDay = dk;
  renderDayContent();
  renderTabs();
}

function render() {
  renderHeader();
  renderTabs();
  renderDayContent();
  updateBillingBadge();
}

function renderHeader() {
  $('weekLabel').textContent = formatWeekLabel(state.weekStart);
  $('revInput').value = getCurrentRevision();
}

function renderTabs() {
  const container = $('daysTabs');
  container.innerHTML = '';
  DAYS.forEach((name, i) => {
    const dk = dayKey(state.weekStart, i);
    const data = getDayData(dk);
    const jobCount = (data.jobs || []).length;
    const tab = document.createElement('div');
    tab.className = 'day-tab';
    if (dk === currentDay) tab.classList.add('active');
    if (jobCount > 0) tab.classList.add('has-jobs');
    if (data.holiday) tab.classList.add('holiday');

    const dateObj = new Date(state.weekStart);
    dateObj.setDate(dateObj.getDate() + i);
    const dateNum = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const shortName = name.slice(0, 3);
    tab.innerHTML = `<span class="day-full">${name}</span><span class="day-short">${shortName}</span> ${dateNum}/${month}`;
    tab.onclick = () => switchDay(dk);
    container.appendChild(tab);
  });
}

function renderDayContent() {
  const data = getDayData(currentDay);
  const content = $('dayContent');

  const dayIdx = DAYS.findIndex((_, i) => dayKey(state.weekStart, i) === currentDay);
  const dayName = DAYS[dayIdx] || '';
  const dateLabel = formatDateShort(currentDay);

  let html = `<div class="day-header">
    <label class="holiday-toggle">
      <input type="checkbox" ${data.holiday ? 'checked' : ''} onchange="toggleHoliday(this.checked)">
      Public Holiday
    </label>`;

  if (data.holiday) {
    html += `<input type="text" class="holiday-label-input" 
      value="${escapeAttr(data.holidayLabel || '')}" 
      placeholder="Holiday name..."
      onchange="setHolidayLabel(this.value)">`;
  }
  html += '</div>';

  html += renderAbsenceRow(currentDay, data);

  if (data.jobs.length === 0) {
    html += '<div class="empty-day">No jobs scheduled for this day.</div>';
  } else {
    html += '<div class="jobs-list">';
    const showMyJobs = currentRole === 'salesman' && document.querySelector('.btn-my-jobs.active');
    data.jobs.forEach((job, idx) => {
      if (showMyJobs && job.salesmanUid !== (currentUser && currentUser.uid)) return;
      html += renderJobCard(job, idx, currentDay);
    });
    html += '</div>';
  }

  content.innerHTML = html;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderAbsenceRow(dk, data) {
  if (!state.members || state.members.length === 0) return '';
  const absences = data.absences || {};
  const hasAbsences = Object.keys(absences).length > 0;

  let html = '<div class="leave-row"><span class="leave-label">Attendance</span>';
  state.members.forEach(name => {
    const status = absences[name] || '';
    const cls = status ? `leave-chip ${status}` : 'leave-chip';
    html += `<div class="${cls}">
      <span class="chip-name">${escapeHtml(name)}${status ? `<span class="absence-badge ${status}">${status === 'leave' ? 'AL' : 'MC'}</span>` : ''}</span>
      <button class="chip-btn btn-leave" onclick="setAbsence('${dk}','${escapeAttr(name)}','${status === 'leave' ? '' : 'leave'}')">AL</button>
      <button class="chip-btn btn-mc" onclick="setAbsence('${dk}','${escapeAttr(name)}','${status === 'mc' ? '' : 'mc'}')">MC</button>
    </div>`;
  });
  html += '</div>';
  return html;
}
