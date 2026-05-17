function applyRole(role) {
  currentRole = role;
  document.body.classList.remove('view-only', 'role-admin', 'role-salesman', 'role-technician');
  if (role === 'admin') document.body.classList.add('role-admin');
  else if (role === 'salesman') document.body.classList.add('role-salesman');
  else if (role === 'technician') document.body.classList.add('role-technician');
  else document.body.classList.add('view-only');
}

function canEdit() {
  return currentRole === 'admin';
}

function canViewBilling() {
  return currentRole === 'admin' || currentRole === 'salesman';
}

function canCycleStatus() {
  return currentRole === 'admin' || currentRole === 'technician';
}

function canManageUsers() {
  return currentRole === 'admin';
}
