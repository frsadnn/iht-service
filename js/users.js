function openManageUsers() {
  if (currentRole !== 'admin') return;
  openModal('usersBg');
  renderUsersList();
}

function renderUsersList() {
  const list = $('usersList');
  list.innerHTML = '<div style="text-align:center;padding:20px;color:#666">Loading...</div>';
  firebase.database().ref('users').once('value').then(snap => {
    const users = snap.val();
    if (!users || Object.keys(users).length === 0) {
      list.innerHTML = '<div class="search-empty">No registered users.</div>';
      return;
    }
    list.innerHTML = '';
    Object.entries(users)
      .sort((a, b) => (a[1].name || '').localeCompare(b[1].name || ''))
      .forEach(([uid, u]) => {
        const row = document.createElement('div');
        row.className = 'user-row';
        const isSelf = currentUser && uid === currentUser.uid;
        const roleOpts = ['pending', 'technician', 'salesman', 'admin'].map(r =>
          `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`
        ).join('');
        row.innerHTML = `
          <div class="user-row-info">
            <div class="user-row-name">${escapeHtml(u.name || 'Unknown')}${isSelf ? ' <em>(you)</em>' : ''}</div>
            <div class="user-row-email">${escapeHtml(u.email || uid)}</div>
          </div>
          <select class="user-row-role" onchange="changeUserRole('${uid}', this.value)" ${isSelf ? 'disabled' : ''}>
            ${roleOpts}
          </select>
          ${isSelf ? '' : `<button class="btn-user-del" onclick="deleteUser('${uid}')">✕</button>`}`;
        list.appendChild(row);
      });
  }).catch(e => {
    list.innerHTML = '<div class="search-empty">Failed to load users.</div>';
  });
}

function changeUserRole(uid, newRole) {
  firebase.database().ref('users/' + uid).update({ role: newRole })
    .then(() => {
      if (newRole !== 'pending') {
        firebase.database().ref('users/' + uid).once('value').then(snap => {
          const u = snap.val();
          if (u && u.telegramChatId) {
            sendTelegram(u.telegramChatId, `✅ Your account has been approved!\nRole: ${newRole.toUpperCase()}\nYou can now access the schedule.`);
          }
        });
      }
    })
    .catch(e => alert('Failed to update role: ' + e.message));
}

function deleteUser(uid) {
  if (!confirm('Remove this user? They will need to register again.')) return;
  firebase.database().ref('users/' + uid).remove()
    .then(() => renderUsersList())
    .catch(e => alert('Failed to remove user: ' + e.message));
}
