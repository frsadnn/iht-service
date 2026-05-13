function openSearch() {
  $('searchInput').value = '';
  $('searchResults').innerHTML = '<div class="search-empty">Type to search jobs…</div>';
  openModal('searchBg');
  setTimeout(() => $('searchInput').focus(), 100);
}

function performSearch() {
  const query = $('searchInput').value.trim().toLowerCase();
  const results = $('searchResults');

  if (!query) {
    results.innerHTML = '<div class="search-empty">Type to search jobs…</div>';
    return;
  }

  const matches = [];
  Object.keys(state.schedule).forEach(dk => {
    const data = state.schedule[dk];
    if (!data || !data.jobs) return;
    const jobs = Array.isArray(data.jobs) ? data.jobs : Object.values(data.jobs);
    jobs.forEach((job, idx) => {
      const searchable = [
        job.customer, job.contact, job.address,
        job.salesman, job.desc, job.team
      ].filter(Boolean).join(' ').toLowerCase();
      if (searchable.includes(query)) {
        matches.push({ dk, idx, job });
      }
    });
  });

  if (matches.length === 0) {
    results.innerHTML = '<div class="search-empty">No jobs found.</div>';
    return;
  }

  matches.sort((a, b) => a.dk.localeCompare(b.dk));
  results.innerHTML = matches.map(({ dk, idx, job }) => `
    <div class="search-result" onclick="goToSearchResult('${dk}')">
      <div class="sr-date">${formatDateShort(dk)}</div>
      <div class="sr-customer">${escapeHtml(job.customer || 'No customer')}</div>
      <div class="sr-team">${escapeHtml(job.team || '')}</div>
      ${job.desc ? `<div class="sr-desc">${escapeHtml(job.desc)}</div>` : ''}
    </div>
  `).join('');
}

function goToSearchResult(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  state.weekStart = isoDate(getMonday(new Date(y, m - 1, d)));
  currentDay = dk;
  closeModal('searchBg');
  render();
}
