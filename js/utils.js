function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayKey(weekStart, dayIndex) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return isoDate(d);
}

function formatWeekLabel(weekStartStr) {
  const [y, m, d] = weekStartStr.split('-').map(Number);
  const mon = new Date(y, m - 1, d);
  const sat = new Date(y, m - 1, d + 5);
  const fmt = dt => dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(mon)} – ${fmt(sat)}`;
}

function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
  });
}

function $(id) {
  return document.getElementById(id);
}

function closeModal(id) {
  $(id).classList.remove('open');
}

function openModal(id) {
  $(id).classList.add('open');
}

function setSyncStatus(status) {
  const dot = $('syncDot');
  const label = $('syncLabel');
  if (!dot || !label) return;
  dot.className = 'sync-dot ' + status;
  const labels = { synced: 'Synced', syncing: 'Syncing...', offline: 'Offline' };
  label.textContent = labels[status] || 'Connecting...';
}
