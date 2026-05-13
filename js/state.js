let state = {
  weekStart: isoDate(getMonday(new Date())),
  schedule: {},
  members: [],
  salesmen: [],
  revNums: {},
  lastModified: 0
};

let currentDay = '';
let currentUser = null;
let currentRole = 'view-only';
let currentScheduleName = '';
let fbRef = null;
let fbReady = false;

function initState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      applyStateData(data);
    } catch (e) {
      console.warn('Failed to load saved state:', e);
    }
  }
  if (!currentDay) {
    currentDay = dayKey(state.weekStart, 0);
  }
}

function applyStateData(data) {
  if (data.weekStart) state.weekStart = data.weekStart;
  state.schedule = data.schedule || {};
  state.members = data.members || [];
  state.salesmen = data.salesmen || [];
  state.revNums = data.revNums || {};
  state.lastModified = data.lastModified || 0;
}

function getStateData() {
  return {
    weekStart: state.weekStart,
    schedule: state.schedule,
    members: state.members,
    salesmen: state.salesmen,
    revNums: state.revNums,
    lastModified: Date.now()
  };
}

function getDayData(dk) {
  if (!state.schedule[dk]) {
    state.schedule[dk] = {
      holiday: false,
      holidayLabel: '',
      jobs: [],
      absences: {}
    };
  }
  const entry = state.schedule[dk];
  if (!Array.isArray(entry.jobs)) {
    entry.jobs = Object.values(entry.jobs || {});
  }
  if (!entry.absences) entry.absences = {};
  return entry;
}

function persistState() {
  const data = getStateData();
  data.lastModified = Date.now();
  state.lastModified = data.lastModified;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (fbRef && currentRole === 'admin') {
    fbRef.set(data).catch(e => {
      console.error('Firebase save error:', e);
      setSyncStatus('offline');
    });
  }
}

function getWeekKey() {
  return state.weekStart;
}

function getCurrentRevision() {
  return state.revNums[getWeekKey()] || 0;
}

function setRevision(val) {
  state.revNums[getWeekKey()] = parseInt(val) || 0;
  persistState();
}
