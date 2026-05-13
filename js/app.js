function initApp() {
  firebase.initializeApp(FIREBASE_CONFIG);
  fbReady = true;

  initState();

  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  $('revInput').addEventListener('change', e => setRevision(e.target.value));
  $('searchInput').addEventListener('input', performSearch);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-bg.open').forEach(m => m.classList.remove('open'));
      closeHistory();
      closeLightbox();
    }
  });

  document.querySelectorAll('.modal-bg').forEach(bg => {
    bg.addEventListener('click', e => {
      if (e.target === bg) bg.classList.remove('open');
    });
  });

  // Close sidebar on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('sidebar').classList.contains('open')) {
      toggleSidebar();
    }
  });

  if (VIEW_ONLY) {
    applyRole('view-only');
    $('authOverlay').classList.remove('open');
    $('userInfo').style.display = 'none';
    document.querySelector('.view-only-badge').style.display = 'inline-block';
    fbRef = firebase.database().ref('scheduleData');
    setupFirebaseListener();
  }

  render();
}

function toggleSidebar() {
  const sidebar = $('sidebar');
  const overlay = $('sidebarOverlay');
  const toggle = $('menuToggle');
  const isOpen = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
  toggle.classList.toggle('open', !isOpen);
}

document.addEventListener('DOMContentLoaded', initApp);
