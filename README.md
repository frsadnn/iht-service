# Service Schedule Web App

A weekly service schedule management app built with plain HTML, CSS, and JavaScript, backed by Firebase Realtime Database.

## Features

- **Authentication** — Email/password login, registration with admin approval
- **Role-based access** — Admin, Salesman, Technician, and View-Only roles
- **Weekly schedule** — Navigate weeks, manage jobs across Monday–Saturday
- **Job management** — Add, edit, delete, reorder, and reschedule jobs
- **Team members** — Assign technicians to jobs via chip-based UI
- **Absence tracking** — Mark members as Leave or MC per day
- **Job status** — Cycle through Pending → In Progress → Completed → Cancelled
- **Comments** — Per-job threaded comments with real-time sync
- **Service requests** — Salesmen submit requests, admins assign to schedule
- **Internal billing** — Flag jobs for billing, track amounts, view summary
- **Search** — Search jobs across all weeks by customer, team, or description
- **WhatsApp export** — Format the week schedule for WhatsApp sharing
- **Photo attachments** — Add photos to jobs with lightbox viewer
- **File attachments** — Attach PDFs, documents, spreadsheets to jobs
- **History** — Save and restore named schedule snapshots
- **Backup/Restore** — Download/upload schedule data as JSON
- **PDF export** — Export the current week as a formatted PDF
- **Telegram notifications** — Bot integration for real-time alerts
- **User management** — Admin panel to manage users and roles
- **Real-time sync** — All changes sync live via Firebase
- **Mobile responsive** — Optimized for phones with bottom-sheet modals

## Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Create a **Realtime Database** and set rules:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

### 2. Configure the App

Edit `js/config.js` and replace the placeholder values with your Firebase project credentials:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};
```

### 3. (Optional) Telegram Bot

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Copy the bot token into `js/config.js`:

```javascript
const TG_TOKEN = 'your-bot-token';
```

### 4. Run the App

Serve the files with any static server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Open `http://localhost:8000` in your browser.

### 5. First User

The first user to register is automatically assigned the **Admin** role. All subsequent users start as **Pending** and need admin approval.

## File Structure

```
iht-service/
├── index.html              # SPA entry point — all views and modals
├── css/
│   ├── variables.css       # CSS custom properties (colors, spacing)
│   ├── base.css            # Reset, body, scrollbars, animations
│   ├── header.css          # Header bar, week nav, user info, sync
│   ├── toolbar.css         # Toolbar action buttons
│   ├── tabs.css            # Day tabs (Mon–Sat)
│   ├── cards.css           # Job cards, status badges, billing badges
│   ├── members.css         # Member chips, absence chips, IB toggle
│   ├── modals.css          # Modal backdrop, form rows, summary table
│   ├── auth.css            # Auth overlay cards (login/register/pending)
│   ├── comments.css        # Comment list, input, edit states
│   ├── requests.css        # Service request list, filters, assign
│   ├── history.css         # History slide-out panel
│   ├── photos.css          # Photo grid, lightbox, file attachments
│   ├── users.css           # User management list
│   ├── utilities.css       # Search, WhatsApp, role-based visibility
│   └── responsive.css      # Mobile/tablet overrides
├── js/
│   ├── config.js           # Firebase config, constants
│   ├── utils.js            # Date helpers, DOM helpers
│   ├── state.js            # State management, persistence
│   ├── roles.js            # Role application, permission checks
│   ├── auth.js             # Login, register, logout, auth state
│   ├── firebase-sync.js    # Realtime Database listener, sync status
│   ├── notifications.js    # Telegram bot integration
│   ├── schedule.js         # Week nav, day tabs, content rendering
│   ├── jobs.js             # Job CRUD, status cycling, reschedule
│   ├── members.js          # Team member CRUD, absence, My Jobs
│   ├── holidays.js         # Holiday toggle and labels
│   ├── comments.js         # Per-job comment CRUD
│   ├── requests.js         # Service request submit/edit/list
│   ├── assign.js           # Assign request to schedule
│   ├── billing.js          # Internal billing summary
│   ├── search.js           # Cross-week job search
│   ├── history.js          # Save/load named schedules
│   ├── whatsapp.js         # WhatsApp text formatting
│   ├── photos.js           # Photo upload, grid, lightbox
│   ├── files.js            # File attachments
│   ├── users.js            # Admin user management
│   ├── backup.js           # JSON backup and restore
│   ├── pdf.js              # PDF export via jsPDF
│   └── app.js              # App initialization
├── assets/
│   └── favicon.ico
└── README.md
```

## Deployment

The app is fully static and can be deployed to any static hosting:

- **GitHub Pages** — Push to a repo and enable Pages
- **Firebase Hosting** — `firebase deploy`
- **Netlify / Vercel** — Connect repo and deploy

## View-Only Mode

Append `?view` to the URL to access the schedule without signing in:

```
https://your-domain.com/?view
```
