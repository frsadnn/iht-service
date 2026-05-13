function openHistory() {
  $('historyPanel').classList.add('open');
  loadHistory();
}

function closeHistory() {
  $('historyPanel').classList.remove('open');
}

function loadHistory() {
  const list = $('historyList');
  list.innerHTML = '<div style="color:#666;font-size:12px;text-align:center;padding:16px">Loading...</div>';
  firebase.database().ref('savedSchedules').once('value').then(snap => {
    const saves = snap.val();
    if (!saves || Object.keys(saves).length === 0) {
      list.innerHTML = '<div style="color:#666;font-size:12px;text-align:center;padding:16px">No saved schedules.</div>';
      return;
    }
    list.innerHTML = '';
    Object.entries(saves)
      .sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0))
      .forEach(([key, save]) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const dateStr = save.savedAt
          ? new Date(save.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '';
        let jobCount = 0;
        if (save.data && save.data.schedule) {
          Object.values(save.data.schedule).forEach(d => {
            const jobs = Array.isArray(d.jobs) ? d.jobs : Object.values(d.jobs || {});
            jobCount += jobs.length;
          });
        }
        item.innerHTML = `
          <div class="hi-week">${escapeHtml(save.name || 'Untitled')}</div>
          <div class="hi-jobs">${jobCount} jobs · ${dateStr}</div>
          <div style="margin-top:4px;display:flex;gap:4px">
            <button style="background:#2980b9;border:none;color:#fff;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer" 
              onclick="restoreHistory('${key}')">Load</button>
            <button style="background:#e74c3c;border:none;color:#fff;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer" 
              onclick="deleteHistory('${key}')">Delete</button>
          </div>`;
        list.appendChild(item);
      });
  }).catch(() => {
    list.innerHTML = '<div style="color:#666;font-size:12px;text-align:center;padding:16px">Failed to load.</div>';
  });
}

function saveToHistory() {
  const name = prompt('Enter a name for this schedule:', formatWeekLabel(state.weekStart));
  if (!name) return;
  const save = {
    name,
    savedAt: Date.now(),
    data: getStateData()
  };
  firebase.database().ref('savedSchedules').push(save)
    .then(() => {
      alert('Schedule saved!');
      if ($('historyPanel').classList.contains('open')) loadHistory();
    })
    .catch(e => alert('Failed to save: ' + e.message));
}

function restoreHistory(key) {
  if (!confirm('Load this schedule? Current unsaved changes will be lost.')) return;
  firebase.database().ref('savedSchedules/' + key + '/data').once('value').then(snap => {
    const data = snap.val();
    if (!data) { alert('No data found.'); return; }
    applyStateData(data);
    currentDay = dayKey(state.weekStart, 0);
    persistState();
    render();
    closeHistory();
  }).catch(e => alert('Failed to load: ' + e.message));
}

function deleteHistory(key) {
  if (!confirm('Delete this saved schedule?')) return;
  firebase.database().ref('savedSchedules/' + key).remove()
    .then(() => loadHistory())
    .catch(e => alert('Failed to delete: ' + e.message));
}
