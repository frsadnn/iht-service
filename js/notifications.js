let prevCommentCounts = {};
let isFirstSchedSnap = true;

function sendTelegram(chatId, text) {
  if (!chatId || !TG_TOKEN) return;
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  }).catch(() => {});
}

function sendTelegramToAdmins(text) {
  if (!TG_TOKEN) return;
  firebase.database().ref('users').once('value').then(snap => {
    snap.forEach(child => {
      const u = child.val();
      if (u.role === 'admin' && u.telegramChatId) sendTelegram(u.telegramChatId, text);
    });
  }).catch(() => {});
}

function sendTelegramToTechnicians(text) {
  if (!TG_TOKEN) return;
  firebase.database().ref('users').once('value').then(snap => {
    snap.forEach(child => {
      const u = child.val();
      if (u.role === 'technician' && u.telegramChatId) sendTelegram(u.telegramChatId, text);
    });
  }).catch(() => {});
}

function sendTelegramToUser(uid, text) {
  if (!uid || !TG_TOKEN) return;
  firebase.database().ref('users/' + uid + '/telegramChatId').once('value').then(snap => {
    const chatId = snap.val();
    if (chatId) sendTelegram(chatId, text);
  }).catch(() => {});
}

function openTgSettings() {
  if (!currentUser) return;
  firebase.database().ref('users/' + currentUser.uid + '/telegramChatId').once('value').then(snap => {
    $('tgChatIdInput').value = snap.val() || '';
    $('tgSaveMsg').textContent = '';
    $('tgFindMsg').textContent = '';
    openModal('tgSettingsBg');
  });
}

function findMyChatId() {
  if (!TG_TOKEN) { showToast('Telegram bot token not configured.', 'error'); return; }
  const btn = $('tgFindBtn');
  const msg = $('tgFindMsg');
  btn.textContent = 'Searching...';
  btn.disabled = true;
  const now = Math.floor(Date.now() / 1000);
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?limit=100`)
    .then(r => r.json())
    .then(data => {
      if (data.ok && data.result.length > 0) {
        const recent = data.result
          .filter(u => u.message && (now - u.message.date) <= 120)
          .sort((a, b) => b.message.date - a.message.date);
        if (recent.length > 0) {
          const chatId = recent[0].message.chat.id;
          $('tgChatIdInput').value = chatId;
          msg.style.color = '#4caf50';
          msg.textContent = `✓ Found your Chat ID: ${chatId}`;
        } else {
          msg.style.color = '#f39c12';
          msg.textContent = 'No recent message found — send a message to the bot then tap again.';
        }
      } else {
        msg.style.color = '#e74c3c';
        msg.textContent = 'No messages found. Send any message to the bot first.';
      }
    })
    .catch(() => {
      msg.style.color = '#e74c3c';
      msg.textContent = 'Connection failed. Please try again.';
    })
    .finally(() => {
      btn.textContent = '🔍 Find My Chat ID';
      btn.disabled = false;
    });
}

function saveTelegramChatId() {
  const chatId = $('tgChatIdInput').value.trim();
  if (!chatId || !currentUser) return;
  firebase.database().ref('users/' + currentUser.uid).update({ telegramChatId: chatId })
    .then(() => {
      $('tgSaveMsg').textContent = '✓ Connected! You will receive Telegram notifications.';
      document.querySelector('.btn-tg').classList.add('connected');
      setTimeout(() => closeModal('tgSettingsBg'), 1500);
    })
    .catch(e => showToast('Failed: ' + e.message, 'error'));
}

function snapshotCommentCounts() {
  const counts = {};
  Object.keys(state.schedule || {}).forEach(dk => {
    const entry = state.schedule[dk];
    if (!entry) return;
    const jobs = Array.isArray(entry.jobs) ? entry.jobs : Object.values(entry.jobs || {});
    jobs.forEach((job, idx) => { counts[dk + '/' + idx] = (job.comments || []).length; });
  });
  return counts;
}

function checkNewComments(oldCounts) {
  Object.keys(state.schedule || {}).forEach(dk => {
    const entry = state.schedule[dk];
    if (!entry) return;
    const jobs = Array.isArray(entry.jobs) ? entry.jobs : Object.values(entry.jobs || {});
    jobs.forEach((job, idx) => {
      const key = dk + '/' + idx;
      const newCount = (job.comments || []).length;
      const oldCount = oldCounts[key] ?? newCount;
      if (newCount > oldCount) {
        const c = job.comments[newCount - 1];
        if (c && c.authorUid !== (currentUser && currentUser.uid)) {
          const preview = (c.text || '').slice(0, 200);
          const author = c.authorName || 'Someone';
          const adminMsg = `💬 New Comment\n👤 ${job.customer || 'Job'}\n📅 ${dk}\n✍️ ${author}: ${preview}`;
          sendTelegramToAdmins(adminMsg);
          if (job.salesmanUid && job.salesmanUid !== c.authorUid) {
            sendTelegramToUser(job.salesmanUid,
              `💬 New Comment on Your Job\n👤 ${job.customer || 'Job'}\n📅 ${dk}\n✍️ ${author}: ${preview}`
            );
          }
        }
      }
    });
  });
}

function checkRevisionChanges(oldRevNums) {
  const newRevNums = state.revNums || {};
  Object.keys(newRevNums).forEach(wk => {
    const oldRev = oldRevNums[wk] || 0;
    const newRev = newRevNums[wk] || 0;
    if (newRev > oldRev) {
      const msg = `📅 Schedule Updated\nWeek: ${formatWeekLabel(wk)}\nRevision: ${newRev}`;
      sendTelegramToTechnicians(msg);
    }
  });
}
