let photoContext = null;

function openPhotos(dk, idx) {
  photoContext = { dayKey: dk, jobIdx: idx };
  const data = getDayData(dk);
  const job = data.jobs[idx];
  if (!job) return;
  renderPhotoGrid(job.photos || []);
  openModal('photoBg');
}

function renderPhotoGrid(photos) {
  const grid = $('photoGrid');
  if (!photos || photos.length === 0) {
    grid.innerHTML = '<div class="comment-empty">No photos yet.</div>';
    return;
  }
  grid.innerHTML = photos.map((p, i) => `
    <div class="photo-thumb" onclick="openLightbox('${p.data}', '${escapeAttr(p.name || '')}')">
      <img src="${p.data}" alt="${escapeAttr(p.name || '')}">
      <button class="photo-del" onclick="event.stopPropagation(); deletePhoto(${i})">&times;</button>
      ${p.name ? `<div class="photo-meta">${escapeHtml(p.name)}</div>` : ''}
    </div>
  `).join('');
}

function addPhoto() {
  if (!photoContext) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = e => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const data = getDayData(photoContext.dayKey);
    const job = data.jobs[photoContext.jobIdx];
    if (!job) return;
    if (!job.photos) job.photos = [];

    let processed = 0;
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 2 MB per photo.`);
        processed++;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        job.photos.push({
          name: file.name,
          data: reader.result,
          addedBy: $('userName') ? $('userName').textContent : '',
          addedAt: Date.now()
        });
        processed++;
        if (processed === files.length) {
          persistState();
          renderPhotoGrid(job.photos);
          render();
        }
      };
      reader.readAsDataURL(file);
    });
  };
  input.click();
}

function deletePhoto(idx) {
  if (!confirm('Delete this photo?')) return;
  if (!photoContext) return;
  const data = getDayData(photoContext.dayKey);
  const job = data.jobs[photoContext.jobIdx];
  if (!job || !job.photos) return;
  job.photos.splice(idx, 1);
  persistState();
  renderPhotoGrid(job.photos);
  render();
}

function openLightbox(src, caption) {
  $('lightboxImg').src = src;
  $('lightboxCaption').textContent = caption;
  $('lightbox').classList.add('open');
}

function closeLightbox() {
  $('lightbox').classList.remove('open');
  $('lightboxImg').src = '';
}
