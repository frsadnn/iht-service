let commentContext = null;

function openComments(dk, idx) {
  commentContext = { dayKey: dk, jobIdx: idx };
  const data = getDayData(dk);
  const job = data.jobs[idx];
  if (!job) return;
  $('commentJobInfo').textContent = job.customer || 'Job ' + (idx + 1);
  renderCommentList(job.comments || []);
  $('commentTextarea').value = '';
  openModal('commentBg');
}

function renderCommentList(comments) {
  const list = $('commentList');
  if (!comments || comments.length === 0) {
    list.innerHTML = '<div class="comment-empty">No comments yet.</div>';
    return;
  }
  list.innerHTML = comments.map((c, i) => {
    const isOwn = currentUser && c.authorUid === currentUser.uid;
    const actions = isOwn ? `<div class="comment-actions">
      <button onclick="editComment(${i})">Edit</button>
      <button onclick="deleteComment(${i})">Del</button>
    </div>` : '';
    return `<div class="comment-item">
      <div class="comment-author">${escapeHtml(c.authorName || 'Unknown')}</div>
      <div class="comment-text" id="commentText${i}">${escapeHtml(c.text || '')}</div>
      <div class="comment-time">${formatTimestamp(c.timestamp)}</div>
      ${actions}
    </div>`;
  }).join('');
  list.scrollTop = list.scrollHeight;
}

function sendComment() {
  if (!commentContext) return;
  const text = $('commentTextarea').value.trim();
  if (!text) return;
  const data = getDayData(commentContext.dayKey);
  const job = data.jobs[commentContext.jobIdx];
  if (!job) return;
  if (!job.comments) job.comments = [];
  const comment = {
    text,
    authorName: $('userName') ? $('userName').textContent : 'Unknown',
    authorUid: currentUser ? currentUser.uid : null,
    timestamp: Date.now()
  };
  job.comments.push(comment);
  $('commentTextarea').value = '';
  persistState();
  renderCommentList(job.comments);
  render();

  sendTelegramToAdmins(
    `💬 New Comment\n👤 ${job.customer || 'Job'}\n📅 ${commentContext.dayKey}\n✍️ ${comment.authorName}: ${text.slice(0, 200)}`
  );
  if (job.salesmanUid && job.salesmanUid !== comment.authorUid) {
    sendTelegramToUser(job.salesmanUid,
      `💬 New Comment on Your Job\n👤 ${job.customer || 'Job'}\n📅 ${commentContext.dayKey}\n✍️ ${comment.authorName}: ${text.slice(0, 200)}`
    );
  }
}

function editComment(idx) {
  if (!commentContext) return;
  const data = getDayData(commentContext.dayKey);
  const job = data.jobs[commentContext.jobIdx];
  const comment = job.comments[idx];
  if (!comment) return;

  const textEl = $('commentText' + idx);
  const parent = textEl.closest('.comment-item');
  parent.innerHTML = `
    <textarea class="comment-edit-textarea" id="editCommentTA">${escapeHtml(comment.text)}</textarea>
    <div class="comment-edit-row">
      <button style="background:#27ae60;color:#fff" onclick="saveCommentEdit(${idx})">Save</button>
      <button style="background:#555;color:#fff" onclick="renderCommentList(getDayData('${commentContext.dayKey}').jobs[${commentContext.jobIdx}].comments)">Cancel</button>
    </div>`;
  $('editCommentTA').focus();
}

function saveCommentEdit(idx) {
  if (!commentContext) return;
  const text = $('editCommentTA').value.trim();
  if (!text) return;
  const data = getDayData(commentContext.dayKey);
  const job = data.jobs[commentContext.jobIdx];
  job.comments[idx].text = text;
  job.comments[idx].edited = Date.now();
  persistState();
  renderCommentList(job.comments);
}

function deleteComment(idx) {
  if (!confirm('Delete this comment?')) return;
  if (!commentContext) return;
  const data = getDayData(commentContext.dayKey);
  const job = data.jobs[commentContext.jobIdx];
  job.comments.splice(idx, 1);
  persistState();
  renderCommentList(job.comments);
  render();
}
