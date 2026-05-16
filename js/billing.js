let ibFilter = 'pending';

function openBillingSummary() {
  ibFilter = 'pending';
  $('ibPendingOnly').checked = true;
  renderBillingSummary();
  openModal('billingSummaryBg');
}

function toggleIBFilter(checked) {
  ibFilter = checked ? 'pending' : 'all';
  renderBillingSummary();
}

function renderBillingSummary() {
  const container = $('billingSummaryContent');
  const items = [];

  Object.keys(state.schedule).forEach(dk => {
    const data = state.schedule[dk];
    if (!data || !data.jobs) return;
    const jobs = Array.isArray(data.jobs) ? data.jobs : Object.values(data.jobs);
    jobs.forEach((job, idx) => {
      if (!job.internalBilling) return;
      if (ibFilter === 'pending' && job.status === 'completed') return;
      items.push({ dk, idx, job });
    });
  });

  if (items.length === 0) {
    container.innerHTML = '<div class="summary-empty">No internal billing jobs found.</div>';
    return;
  }

  let total = 0;
  let html = `<table class="summary-table">
    <tr><th>Date</th><th>Customer</th><th>Salesman</th><th>Team</th><th>Amount</th><th>Status</th></tr>`;

  items.sort((a, b) => a.dk.localeCompare(b.dk));
  items.forEach(({ dk, job }) => {
    const amt = parseFloat(job.ibAmount) || 0;
    total += amt;
    const salesmanCell = job.salesman
      ? `<span class="salesman-name">${escapeHtml(job.salesman)}</span>`
      : '—';
    html += `<tr>
      <td>${formatDateShort(dk)}</td>
      <td>${escapeHtml(job.customer || '')}</td>
      <td>${salesmanCell}</td>
      <td>${escapeHtml(job.team || '')}</td>
      <td>RM ${amt.toFixed(2)}</td>
      <td><span class="status-badge ${job.status || 'pending'}">● ${STATUS_LABELS[job.status || 'pending']}</span></td>
    </tr>`;
  });

  html += `<tr class="total-row">
    <td colspan="4">Total</td>
    <td>RM ${total.toFixed(2)}</td>
    <td>${items.length} jobs</td>
  </tr></table>`;

  container.innerHTML = html;
}

function updateBillingBadge() {
  let count = 0;
  Object.keys(state.schedule).forEach(dk => {
    const data = state.schedule[dk];
    if (!data || !data.jobs) return;
    const jobs = Array.isArray(data.jobs) ? data.jobs : Object.values(data.jobs);
    jobs.forEach(job => {
      if (job.internalBilling && job.status !== 'completed') count++;
    });
  });
  const badge = $('ibCount');
  if (badge) {
    badge.textContent = count;
  }
}
