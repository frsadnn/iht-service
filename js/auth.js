function showLogin() {
  $('loginCard').style.display = '';
  $('registerCard').style.display = 'none';
  $('pendingCard').style.display = 'none';
  $('loginError').textContent = '';
  setTimeout(() => $('loginEmail').focus(), 100);
}

function showRegister() {
  $('loginCard').style.display = 'none';
  $('registerCard').style.display = '';
  $('pendingCard').style.display = 'none';
  $('regError').textContent = '';
  $('regName').value = '';
  $('regEmail').value = '';
  $('regPass').value = '';
  $('regPassConfirm').value = '';
  setTimeout(() => $('regName').focus(), 100);
}

function loginUser() {
  const email = $('loginEmail').value.trim();
  const pass = $('loginPass').value;
  const errEl = $('loginError');
  errEl.textContent = '';
  if (!email || !pass) { errEl.textContent = 'Please enter email and password.'; return; }
  firebase.auth().signInWithEmailAndPassword(email, pass)
    .catch(e => { errEl.textContent = getAuthError(e.code); });
}

function registerUser() {
  const name = $('regName').value.trim();
  const email = $('regEmail').value.trim();
  const pass = $('regPass').value;
  const passConfirm = $('regPassConfirm').value;
  const errEl = $('regError');
  errEl.textContent = '';
  if (!name || !email || !pass || !passConfirm) { errEl.textContent = 'Please fill all fields.'; return; }
  if (pass !== passConfirm) { errEl.textContent = 'Passwords do not match.'; return; }
  if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  firebase.auth().createUserWithEmailAndPassword(email, pass)
    .then(cred => {
      return firebase.database().ref('users').once('value').then(snap => {
        const existing = snap.val() || {};
        const isFirst = Object.keys(existing).filter(k => k !== cred.user.uid).length === 0;
        const role = isFirst ? 'admin' : 'pending';
        return firebase.database().ref('users/' + cred.user.uid).set({
          name, email, role, createdAt: Date.now()
        }).then(() => {
          if (role === 'pending') {
            sendTelegramToAdmins(
              `🆕 New User Registration\n👤 ${name}\n📧 ${email}\n⏳ Pending approval — go to Users to assign a role.`
            );
          }
        });
      });
    })
    .catch(e => { $('regError').textContent = getAuthError(e.code); });
}

function logoutUser() {
  if (fbRef) fbRef.off();
  if (fbReqRef) { fbReqRef.off(); fbReqRef = null; }
  $('reqCount').style.display = 'none';
  firebase.auth().signOut().then(() => {
    currentUser = null;
    applyRole('view-only');
    $('userInfo').style.display = 'none';
    if (!VIEW_ONLY) {
      openModal('authOverlay');
      showLogin();
    }
    setSyncStatus('offline');
  });
}

function getAuthError(code) {
  const msgs = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password is too weak.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/invalid-credential': 'Invalid email or password.'
  };
  return msgs[code] || 'Authentication failed. Please try again.';
}

function fetchUserData(uid) {
  return firebase.database().ref('users/' + uid).once('value').then(snap => snap.val() || {});
}

function updateUserInfo(name, role) {
  const info = $('userInfo');
  info.style.display = 'flex';
  $('userName').textContent = name;
  const badge = $('userRoleBadge');
  badge.textContent = role.toUpperCase();
  badge.className = 'role-badge ' + role;
  if (currentUser) {
    firebase.database().ref('users/' + currentUser.uid + '/telegramChatId').once('value').then(snap => {
      document.querySelector('.btn-tg').classList.toggle('connected', !!snap.val());
    });
  }
}

function startEditName() {
  const span = $('userName');
  const current = span.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = current;
  input.style.cssText = 'background:#f0f0f0;border:1px solid #1db954;color:#1a1a1a;font-size:12px;font-weight:600;padding:2px 6px;border-radius:4px;width:120px;outline:none';
  span.replaceWith(input);
  input.focus();
  input.select();
  const save = () => {
    const newName = input.value.trim();
    const restored = document.createElement('span');
    restored.className = 'user-name';
    restored.id = 'userName';
    restored.title = 'Click to edit name';
    restored.style.cursor = 'pointer';
    restored.onclick = startEditName;
    restored.textContent = newName || current;
    input.replaceWith(restored);
    if (newName && newName !== current && currentUser) {
      firebase.database().ref('users/' + currentUser.uid + '/name').set(newName)
        .catch(e => showToast('Failed to update name: ' + e.message, 'error'));
    }
  };
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = current; input.blur(); }
  });
}

function onAuthStateChanged(user) {
  if (user) {
    currentUser = user;
    fetchUserData(user.uid).then(userData => {
      if (!userData.role || userData.role === 'pending') {
        $('authOverlay').classList.add('open');
        $('loginCard').style.display = 'none';
        $('registerCard').style.display = 'none';
        $('pendingCard').style.display = '';
        return;
      }
      $('authOverlay').classList.remove('open');
      currentScheduleName = userData.scheduleName || userData.name || '';
      applyRole(userData.role);
      updateUserInfo(userData.name || user.email, userData.role);
      fbRef = firebase.database().ref('scheduleData');
      setupFirebaseListener();
    });
  } else {
    currentUser = null;
    if (VIEW_ONLY) {
      applyRole('view-only');
      $('authOverlay').classList.remove('open');
      $('userInfo').style.display = 'none';
      document.querySelector('.view-only-badge').style.display = 'inline-block';
      fbRef = firebase.database().ref('scheduleData');
      setupFirebaseListener();
    } else {
      openModal('authOverlay');
      showLogin();
    }
  }
}
