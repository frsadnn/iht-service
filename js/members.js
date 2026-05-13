let showMemberManage = false;
let showSalesmanManage = false;

function toggleMemberManage() {
  showMemberManage = !showMemberManage;
  const el = $('memberManageArea');
  el.style.display = showMemberManage ? '' : 'none';
  if (showMemberManage) renderMemberRemoveList();
}

function addMember() {
  const input = $('newMemberInput');
  const raw = input.value.trim();
  if (!raw) return;
  const names = raw.split(',').map(n => n.trim()).filter(Boolean);
  let added = 0;
  names.forEach(name => {
    if (!state.members.includes(name)) {
      state.members.push(name);
      added++;
    }
  });
  if (added === 0) { alert('Member(s) already exist.'); return; }
  input.value = '';
  persistState();
  renderMemberRemoveList();
  if ($('jobModalBg').classList.contains('open')) {
    const checked = getJobCheckedMembers();
    renderJobMemberGrid(checked);
  }
  render();
}

function removeMember(name) {
  if (!confirm(`Remove "${name}" from team members?`)) return;
  state.members = state.members.filter(m => m !== name);
  persistState();
  renderMemberRemoveList();
  render();
}

function renderMemberRemoveList() {
  const container = $('memberRemoveList');
  if (!container) return;
  container.innerHTML = '';
  state.members.forEach(name => {
    container.innerHTML += `<div class="member-remove-chip">
      ${escapeHtml(name)}
      <button onclick="removeMember('${escapeAttr(name)}')">&times;</button>
    </div>`;
  });
}

// Salesmen management
function toggleSalesmanManage() {
  showSalesmanManage = !showSalesmanManage;
  const el = $('salesmanManageArea');
  el.style.display = showSalesmanManage ? '' : 'none';
  if (showSalesmanManage) renderSalesmanRemoveList();
}

function addSalesman() {
  const input = $('newSalesmanInput');
  const name = input.value.trim();
  if (!name) return;
  if (!state.salesmen) state.salesmen = [];
  if (state.salesmen.includes(name)) { alert('Salesman already exists.'); return; }
  state.salesmen.push(name);
  input.value = '';
  persistState();
  renderSalesmanRemoveList();
}

function removeSalesman(name) {
  if (!confirm(`Remove "${name}" from salesmen?`)) return;
  state.salesmen = state.salesmen.filter(s => s !== name);
  persistState();
  renderSalesmanRemoveList();
}

function renderSalesmanRemoveList() {
  const container = $('salesmanRemoveList');
  if (!container) return;
  container.innerHTML = '';
  (state.salesmen || []).forEach(name => {
    container.innerHTML += `<div class="member-remove-chip">
      ${escapeHtml(name)}
      <button onclick="removeSalesman('${escapeAttr(name)}')">&times;</button>
    </div>`;
  });
}

// Absence management
function setAbsence(dk, name, type) {
  const data = getDayData(dk);
  if (type) {
    data.absences[name] = type;
  } else {
    delete data.absences[name];
  }
  persistState();
  render();
}

// My Jobs toggle for salesmen
function toggleMyJobs(btn) {
  btn.classList.toggle('active');
  renderDayContent();
}
