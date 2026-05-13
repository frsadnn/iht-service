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

document.addEventListener('DOMContentLoaded', initApp);
