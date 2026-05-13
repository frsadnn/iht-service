function exportPDF() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    alert('PDF library not loaded. Please check your internet connection.');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Service Schedule', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(formatWeekLabel(state.weekStart), margin, y);
  const rev = getCurrentRevision();
  if (rev) {
    doc.text(`Rev ${rev}`, pageWidth - margin - 20, y);
  }
  y += 10;

  DAYS.forEach((dayName, i) => {
    const dk = dayKey(state.weekStart, i);
    const data = getDayData(dk);
    const dateObj = new Date(state.weekStart);
    dateObj.setDate(dateObj.getDate() + i);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    if (y > 260) { doc.addPage(); y = 20; }

    doc.setFillColor(29, 185, 84);
    doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`${dayName} — ${dateStr}`, margin + 3, y + 1);
    doc.setTextColor(0, 0, 0);
    y += 10;

    if (data.holiday) {
      doc.setFont(undefined, 'italic');
      doc.setFontSize(10);
      doc.text(data.holidayLabel || 'Public Holiday', margin + 3, y);
      doc.setFont(undefined, 'normal');
      y += 8;
      return;
    }

    if (data.jobs.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('No jobs scheduled', margin + 3, y);
      doc.setTextColor(0, 0, 0);
      y += 8;
      return;
    }

    data.jobs.forEach((job, idx) => {
      if (y > 270) { doc.addPage(); y = 20; }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${idx + 1}. ${job.team || 'No team'}`, margin + 3, y);
      y += 5;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);

      if (job.customer) {
        let line = job.customer;
        if (job.contact) line += ` — ${job.contact}`;
        doc.text(line, margin + 8, y);
        y += 4;
      }
      if (job.address) {
        doc.text(job.address, margin + 8, y);
        y += 4;
      }
      if (job.salesman) {
        doc.text(`(${job.salesman})`, margin + 8, y);
        y += 4;
      }
      if (job.desc) {
        const descLines = doc.splitTextToSize(job.desc, pageWidth - margin * 2 - 12);
        descLines.forEach(line => {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(line, margin + 8, y);
          y += 4;
        });
      }
      y += 3;
    });
    y += 4;
  });

  doc.save(`schedule-${state.weekStart}.pdf`);
}
