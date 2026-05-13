function openWhatsApp() {
  const text = generateWhatsAppText();
  $('waPreview').textContent = text;
  $('copySuccessLabel').classList.remove('show');
  openModal('whatsappBg');
}

function generateWhatsAppText() {
  const weekLabel = formatWeekLabel(state.weekStart);
  const rev = getCurrentRevision();
  let lines = [];
  lines.push(`⚙ SERVICE SCHEDULE`);
  lines.push(`📅 ${weekLabel}`);
  if (rev) lines.push(`Rev ${rev}`);
  lines.push('');

  DAYS.forEach((dayName, i) => {
    const dk = dayKey(state.weekStart, i);
    const data = getDayData(dk);

    const dateObj = new Date(state.weekStart);
    dateObj.setDate(dateObj.getDate() + i);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`📌 *${dayName.toUpperCase()}* — ${dateStr}`);

    if (data.holiday) {
      lines.push(`🔴 ${data.holidayLabel || 'Public Holiday'}`);
      lines.push('');
      return;
    }

    const absences = data.absences || {};
    const absentList = Object.entries(absences);
    if (absentList.length > 0) {
      const absList = absentList.map(([n, t]) => `${n} (${t.toUpperCase()})`).join(', ');
      lines.push(`⚠️ Absent: ${absList}`);
    }

    if (data.jobs.length === 0) {
      lines.push('— No jobs —');
      lines.push('');
      return;
    }

    data.jobs.forEach((job, idx) => {
      lines.push('');
      lines.push(`*${idx + 1}. ${job.team || 'No team'}*`);
      if (job.customer) {
        let custLine = `👤 ${job.customer}`;
        if (job.contact) custLine += ` — ${job.contact}`;
        lines.push(custLine);
      }
      if (job.address) lines.push(`📍 ${job.address}`);
      if (job.salesman) lines.push(`(${job.salesman})`);
      if (job.desc) lines.push(`📝 ${job.desc}`);
      if (job.internalBilling) lines.push(`💰 IB: RM ${job.ibAmount || 0}`);
    });
    lines.push('');
  });

  return lines.join('\n');
}

function copyWhatsAppText() {
  const text = $('waPreview').textContent;
  navigator.clipboard.writeText(text).then(() => {
    $('copySuccessLabel').classList.add('show');
    setTimeout(() => $('copySuccessLabel').classList.remove('show'), 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    $('copySuccessLabel').classList.add('show');
    setTimeout(() => $('copySuccessLabel').classList.remove('show'), 2000);
  });
}
