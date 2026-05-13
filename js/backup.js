function downloadBackup() {
  const data = getStateData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schedule-backup-${state.weekStart}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function restoreBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.schedule) {
          showToast('Invalid backup file. Missing schedule data.', 'error');
          return;
        }
        if (!confirm('Restore from backup? Current data will be overwritten.')) return;
        applyStateData(data);
        currentDay = dayKey(state.weekStart, 0);
        persistState();
        render();
        showToast('Backup restored successfully!', 'success');
      } catch (err) {
        showToast('Invalid JSON file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
