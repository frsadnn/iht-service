function toggleHoliday(checked) {
  const data = getDayData(currentDay);
  data.holiday = checked;
  if (!checked) data.holidayLabel = '';
  persistState();
  render();
}

function setHolidayLabel(value) {
  const data = getDayData(currentDay);
  data.holidayLabel = value;
  persistState();
}
