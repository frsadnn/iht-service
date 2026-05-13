const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD917lS3eU9S4uFlL7dbSg8E4mgmfDfOlg",
  authDomain: "iht-service.firebaseapp.com",
  databaseURL: "https://iht-service-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iht-service",
  storageBucket: "iht-service.firebasestorage.app",
  messagingSenderId: "560874976185",
  appId: "1:560874976185:web:61c082ca5986febef6bc68",
  measurementId: "G-NL6RXMNDXP"
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STORAGE_KEY = 'iht_schedule_v1';
const VIEW_ONLY = new URLSearchParams(window.location.search).has('view');

const STATUS_CYCLE = ['pending', 'in-progress', 'completed', 'cancelled'];
const STATUS_LABELS = {
  'pending': 'Pending',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
};

const TG_TOKEN = '';
