let fileContext = null;

function openFiles(dk, idx) {
  fileContext = { dayKey: dk, jobIdx: idx };
  const data = getDayData(dk);
  const job = data.jobs[idx];
  if (!job) return;
  renderFileGrid(job.files || []);
  openModal('fileBg');
}

function renderFileGrid(files) {
  const list = $('fileGrid');
  if (!files || files.length === 0) {
    list.innerHTML = '<div class="comment-empty">No files attached.</div>';
    return;
  }
  list.innerHTML = files.map((f, i) => `
    <div class="file-item">
      <span class="file-name" onclick="downloadFile(${i})">${escapeHtml(f.name || 'File')}</span>
      <span class="file-size">${f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''}</span>
      <button class="file-del" onclick="deleteFile(${i})">&times;</button>
    </div>
  `).join('');
}

function addFile() {
  if (!fileContext) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5 MB.'); return; }
    const data = getDayData(fileContext.dayKey);
    const job = data.jobs[fileContext.jobIdx];
    if (!job) return;
    if (!job.files) job.files = [];
    const reader = new FileReader();
    reader.onload = () => {
      job.files.push({
        name: file.name,
        size: file.size,
        data: reader.result,
        addedBy: $('userName') ? $('userName').textContent : '',
        addedAt: Date.now()
      });
      persistState();
      renderFileGrid(job.files);
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function deleteFile(idx) {
  if (!confirm('Delete this file?')) return;
  if (!fileContext) return;
  const data = getDayData(fileContext.dayKey);
  const job = data.jobs[fileContext.jobIdx];
  if (!job || !job.files) return;
  job.files.splice(idx, 1);
  persistState();
  renderFileGrid(job.files);
}

function downloadFile(idx) {
  if (!fileContext) return;
  const data = getDayData(fileContext.dayKey);
  const job = data.jobs[fileContext.jobIdx];
  if (!job || !job.files || !job.files[idx]) return;
  const f = job.files[idx];
  const a = document.createElement('a');
  a.href = f.data;
  a.download = f.name || 'download';
  a.click();
}
