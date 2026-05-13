let currentReqFilter = 'new';
let assigningReqKey = null;
let assigningReq = null;
let fbReqRef = null;
let editingReqKey = null;
let currentReqFiles = [];

function openServiceRequest() {
  editingReqKey = null;
  currentReqFiles = [];
  $('srCustomer').value = '';
  $('srContact').value = '';
  $('srAddress').value = '';
  $('srDate').value = '';
  $('srDesc').value = '';
  $('srTechCount').value = '';
  renderReqFileList();
  document.querySelector('#svcReqBg h2').textContent = '📋 New Service Request';
  document.querySelector('#svcReqBg .btn-confirm').textContent = 'Submit Request';
  openModal('svcReqBg');
  setTimeout(() => $('srCustomer').focus(), 100);
}

function editRequest(key) {
  firebase.database().ref('requests/' + key).once('value').then(snap => {
    const r = snap.val();
    if (!r) return;
    editingReqKey = key;
    currentReqFiles = r.files || [];
    $('srCustomer').value = r.customer || '';
    $('srContact').value = r.contact || '';
    $('srAddress').value = r.address || '';
    $('srDate').value = r.preferredDate || '';
    $('srDesc').value = r.desc || '';
    $('srTechCount').value = r.techCount || '';
    renderReqFileList();
    document.querySelector('#svcReqBg h2').textContent = '✏️ Edit Request';
    document.querySelector('#svcReqBg .btn-confirm').textContent = 'Update Request';
    closeModal('requestsBg');
    openModal('svcReqBg');
    setTimeout(() => $('srCustomer').focus(), 100);
  });
}

function submitServiceRequest() {
  const customer = $('srCustomer').value.trim();
  if (!customer) { showToast('Please enter customer name.', 'error'); return; }
  const fields = {
    customer,
    contact: $('srContact').value.trim(),
    address: $('srAddress').value.trim(),
    preferredDate: $('srDate').value,
    desc: $('srDesc').value.trim(),
    techCount: $('srTechCount').value || null,
    files: currentReqFiles.length ? currentReqFiles : null
  };
  if (editingReqKey) {
    firebase.database().ref('requests/' + editingReqKey).update(fields)
      .then(() => {
        if (currentRole === 'salesman') {
          const name = $('userName').textContent || 'Salesman';
          sendTelegramToAdmins(`✏️ Request Updated by Salesman\n👤 ${fields.customer}\n🙋 By: ${name}`);
        }
        editingReqKey = null;
        closeModal('svcReqBg');
        openModal('requestsBg');
        loadRequests();
      })
      .catch(e => showToast('Failed to update: ' + e.message, 'error'));
  } else {
    const req = {
      ...fields,
      salesmanName: currentScheduleName || $('userName').textContent || '',
      salesmanEmail: currentUser ? (currentUser.email || '') : '',
      submittedByUid: currentUser ? currentUser.uid : null,
      status: 'new',
      createdAt: Date.now()
    };
    firebase.database().ref('requests').push(req)
      .then(() => {
        const lines = [
          `📋 New Service Request`,
          `👤 ${req.customer}`,
          req.contact ? `📞 ${req.contact}` : null,
          req.address ? `📍 ${req.address}` : null,
          req.preferredDate ? `📅 Preferred: ${req.preferredDate}` : null,
          req.desc ? `📝 ${req.desc}` : null,
          `🙋 By: ${req.salesmanName || req.salesmanEmail || 'Unknown'}`
        ].filter(Boolean).join('\n');
        sendTelegramToAdmins(lines);
        closeModal('svcReqBg');
        showToast('Request submitted! Admin will assign it to the schedule.', 'success');
      })
      .catch(e => showToast('Failed to submit: ' + e.message, 'error'));
  }
}

function openRequestsPanel() {
  currentReqFilter = 'new';
  document.querySelectorAll('.req-filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelector('#requestsBg h2').textContent = currentRole === 'salesman' ? '📋 My Requests' : '📬 Service Requests';
  openModal('requestsBg');
  loadRequests();
}

function filterRequests(btn, filter) {
  currentReqFilter = filter;
  document.querySelectorAll('.req-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadRequests();
}

function loadRequests() {
  const list = $('requestsList');
  list.innerHTML = '<div style="text-align:center;padding:20px;color:#666">Loading...</div>';
  const isSalesman = currentRole === 'salesman';
  firebase.database().ref('requests').once('value').then(snap => {
    const all = [];
    snap.forEach(child => { const r = child.val(); r._key = child.key; all.push(r); });
    const mine = isSalesman
      ? all.filter(r => r.submittedByUid === (currentUser && currentUser.uid))
      : all;
    mine.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const filtered = currentReqFilter === 'all' ? mine : mine.filter(r => r.status === currentReqFilter);
    if (filtered.length === 0) {
      list.innerHTML = `<div class="search-empty">No ${currentReqFilter === 'all' ? '' : currentReqFilter} requests.</div>`;
      return;
    }
    list.innerHTML = '';
    filtered.forEach(r => {
      const item = document.createElement('div');
      item.className = 'request-item' + (r.status === 'scheduled' ? ' req-scheduled' : r.status === 'cancelled' ? ' req-cancelled' : '');
      const dateStr = new Date(r.createdAt || 0).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const prefHtml = r.preferredDate ? `<span class="req-pref-date">Preferred: ${r.preferredDate}</span> · ` : '';
      const schedHtml = r.scheduledTo ? `<span class="req-sched-badge">✓ ${r.scheduledTo}${r.scheduledTeam ? ' · ' + r.scheduledTeam : ''}</span>` : '';
      const canAdminEdit = currentRole === 'admin' && r.status === 'new';
      const isOwn = currentUser && r.submittedByUid === currentUser.uid;
      const canEdit = isOwn && r.status === 'new';
      const adminActions = canAdminEdit
        ? `<button class="btn-assign" onclick="openAssign('${r._key}')">📅 Assign</button>
           <button class="btn-req-del" onclick="editRequest('${r._key}')">✏️ Edit</button>` : '';
      const editBtn = canEdit
        ? `<button class="btn-req-del" onclick="editRequest('${r._key}')">✏️ Edit</button>` : '';
      const delBtn = (currentRole === 'admin' || canEdit)
        ? `<button class="btn-req-del" onclick="deleteRequest('${r._key}')">✕</button>` : '';
      item.innerHTML = `
        <div class="req-item-body">
          <div class="req-customer">${escapeHtml(r.customer)}${schedHtml}</div>
          ${r.contact ? `<span class="req-detail">📞 ${escapeHtml(r.contact)}</span>` : ''}
          ${r.address ? `<span class="req-detail">📍 ${escapeHtml(r.address)}</span>` : ''}
          ${r.desc ? `<div class="req-desc">${escapeHtml(r.desc)}</div>` : ''}
          ${r.techCount ? `<div class="req-desc">👷 Recommended: ${r.techCount} technician${r.techCount > 1 ? 's' : ''}</div>` : ''}
          <div class="req-meta">${prefHtml}By ${escapeHtml(r.salesmanName || r.salesmanEmail || '?')} · ${dateStr}</div>
        </div>
        <div class="req-actions">${adminActions}${editBtn}${delBtn}</div>`;
      list.appendChild(item);
    });
  }).catch(() => {
    list.innerHTML = '<div class="search-empty">Failed to load.</div>';
  });
}

function deleteRequest(key) {
  if (!confirm('Remove this request?')) return;
  firebase.database().ref('requests/' + key).once('value').then(snap => {
    const r = snap.val();
    return firebase.database().ref('requests/' + key).remove().then(() => {
      if (currentRole === 'salesman' && r) {
        const name = $('userName').textContent || 'Salesman';
        sendTelegramToAdmins(`🗑️ Request Deleted by Salesman\n👤 ${r.customer}\n🙋 By: ${name}`);
      }
      loadRequests();
    });
  }).catch(e => showToast('Failed: ' + e.message, 'error'));
}

function renderReqFileList() {
  const container = $('reqFileList');
  if (!container) return;
  if (!currentReqFiles || currentReqFiles.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = currentReqFiles.map((f, i) => `
    <div class="file-item">
      <span class="file-name">${escapeHtml(f.name || 'File')}</span>
      <span class="file-size">${f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''}</span>
      <button class="file-del" onclick="removeReqFile(${i})">&times;</button>
    </div>
  `).join('');
}

function removeReqFile(idx) {
  currentReqFiles.splice(idx, 1);
  renderReqFileList();
}

function addReqFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File too large. Max 5 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      currentReqFiles.push({ name: file.name, size: file.size, data: reader.result });
      renderReqFileList();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}
