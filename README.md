# Pharmacy Daily Accounting & Sales Management — Web App + PWA

A production-ready bilingual (English / বাংলা) pharmacy accounting app with a 4-digit
PIN lock, Firebase Firestore sync, offline medicine autocomplete, smart quick-entry
parsing, a Telegram bot webhook, and automated daily backup to Gmail + Google Drive.
Builds as a PWA and exports to an Android APK via Capacitor.

## Features

- **PIN Lock Screen** — 4-digit PIN required on every open/reload (configurable in Settings).
- **Bilingual UI** — instant English / বাংলা toggle across every screen.
- **Medicine Database** — MedEx scraper (`scripts/scrape-medex.js`) → `src/data/medicines.json`;
  2-char autocomplete; new medicines auto-saved to `custom_medicines` in Firestore.
- **Daily Cash Accounting** — Sales, Dues (baki), General Expenses, and Net Cash in Hand
  (`(Sales + Due Collected) - Expenses`) with a date filter.
- **Smart Quick Entry** — type `"napa 10 pc 12 taka"` in one box and it logs a sale.
- **Telegram Bot Webhook** — same text format over Telegram, saved to today's `sales`.
- **Automated Daily Backup** — runs 11:55 PM BDT; generates CSV/JSON report, uploads to a
  Google Drive folder, emails the summary to your Gmail. Also a manual **Backup & Email Report** button.

## Tech Stack
React 18 + Vite + Tailwind CSS + Lucide Icons + VitePWA + Capacitor + Firebase Firestore
+ Node.js serverless functions (Telegram webhook, backups via Nodemailer + Google Drive API).

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure credentials
cp .env.example .env
# Edit .env with your Firebase, Telegram Bot, and Google credentials (see below)

# 3. (Optional) Build the medicine database from MedEx
node scripts/scrape-medex.js
node scripts/seed-medicines.js

# 4. Run locally
npm run dev
# Open http://localhost:5173

# 5. Build for production
npm run build

# 6. Set up Capacitor (Android APK)
npx cap add android          # Already done, but run if needed
npx cap sync                 # Sync web assets to native project
npx cap run android          # Build APK and run on device/emulator
# Or: npx cap open android   # Open in Android Studio for manual build
```

## Credential Setup (`.env`)

Copy `.env.example` to `.env` and fill in all values:

```env
# Firebase (client-safe — safe to expose in web app)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:AAYourBotTokenHere

# Google Service Account (for Drive + Gmail backups)
# Path to downloaded service-account JSON key file
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
# Email of the service account
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
# Recipient for daily backup report email
OWNER_GMAIL=owner@gmail.com
# Google Drive folder ID where backups are uploaded
DRIVE_FOLDER_ID=1abcDEFghiJKLmnopQRstuVwxyz

# App settings
DEFAULT_PIN=1234
BACKUP_TIME_BDT=23:55
```

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com) → Create project.
2. Enable **Firestore Database** (Native mode) and **Authentication** (Email/Password or Anonymous).
3. Project Settings → Your Apps → Web app (</>) → Register app → Copy config object.
4. Paste the keys into `.env` as `VITE_FIREBASE_*`.
5. Firestore rules (for testing — restrict in production):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Telegram Bot Setup
1. Talk to [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token.
2. Set `TELEGRAM_BOT_TOKEN` in `.env`.
3. After deploying Functions (see below), set the webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://<region>-<project>.cloudfunctions.net/telegramWebhook"
   ```
   Or use BotFather's `/setwebhook` command.

### Google Service Account (Gmail + Drive Backups)
1. Google Cloud Console → IAM & Admin → Service Accounts → Create Service Account.
2. Grant **Drive** and **Gmail Send** roles (or **Editor** for full access).
3. Create a key (JSON) → download to a secure path (e.g., `~/keys/service-account.json`).
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to that absolute path in `.env`.
5. Share your target Drive folder with the service-account email (Editor access).
6. For Gmail: In Gmail Settings → Accounts and Import → "Send mail as" → Add the service account email
   and verify. Or use OAuth2 with the service account (requires domain-wide delegation for workspace).

### Serverless Functions (Telegram Webhook + Backups)
```bash
cd functions
npm install

# Configure secrets for Firebase Functions
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set GOOGLE_APPLICATION_CREDENTIALS  # Upload the JSON file
firebase functions:secrets:set OWNER_GMAIL
firebase functions:secrets:set DRIVE_FOLDER_ID
firebase functions:secrets:set GOOGLE_CLIENT_ID
firebase functions:secrets:set GOOGLE_CLIENT_SECRET
firebase functions:secrets:set GOOGLE_REFRESH_TOKEN

# Deploy
firebase deploy --only functions
```
The deployed webhook URL will be: `https://<region>-<project>.cloudfunctions.net/telegramWebhook`

## Android APK Build (Capacitor)

### Prerequisites
- **Android Studio** installed with SDK (API 34)
- **Java 17** JDK
- Android device with USB debugging OR emulator

### Build Steps
```bash
# 1. Ensure production build exists
npm run build

# 2. Sync web assets to native project
npx cap sync android

# 3a. Build APK via CLI (requires Gradle/Android SDK in PATH)
npx cap run android

# 3b. OR open in Android Studio for manual build/signing
npx cap open android
# In Android Studio: Build → Build Bundle(s)/APK(s) → Build APK(s)
```

### Signing Release APK
1. In Android Studio: Build → Generate Signed Bundle/APK
2. Create keystore: `keytool -genkey -v -keystore pharmacy-release.keystore -alias pharmacy -keyalg RSA -keysize 2048 -validity 10000`
3. Configure `android/app/build.gradle` signing config (or use Android Studio UI)

### Capacitor Config Notes
- `capacitor.config.json` is pre-configured with:
  - App name: "Pharmacy Accounting"
  - Package ID: `com.pharmacy.accounting`
  - Web dir: `dist`
  - Splash screen, keyboard, status bar plugins configured
  - Android target SDK 34, compile SDK 34

## Project Structure

```
.
├── CLAUDE.md                  # Architecture documentation
├── README.md                  # This file
├── .env.example               # Environment template
├── package.json
├── vite.config.js             # Vite + PWA config
├── tailwind.config.js
├── postcss.config.js
├── capacitor.config.json      # Capacitor config
├── index.html
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon.svg               # App icon (SVG)
│   └── robots.txt
├── src/
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Root component + routing
│   ├── index.css              # Tailwind + custom styles
│   ├── components/            # Shared UI components
│   │   ├── LockScreen.jsx
│   │   └── MedicineAutocomplete.jsx
│   ├── contexts/              # React contexts
│   │   ├── LanguageContext.jsx    # i18n (en/bn)
│   │   ├── AuthContext.jsx        # PIN lock
│   │   └── ToastContext.jsx       # Notifications
│   ├── hooks/
│   │   └── useFirestoreCollection.js  # Firestore sync + offline
│   ├── services/
│   │   ├── firebase.js          # Firebase init
│   │   ├── firestore.js         # CRUD + offline fallback
│   │   ├── cache.js             # Medicine cache + custom meds
│   │   └── backup.js            # Manual backup trigger
│   ├── pages/
│   │   ├── DashboardPage.jsx    # Summary + tabs
│   │   ├── SalesPage.jsx        # Sales + quick entry
│   │   ├── DuesPage.jsx         # Baki management
│   │   ├── ExpensesPage.jsx     # General expenses
│   │   └── SettingsPage.jsx     # PIN, language, backup
│   ├── utils/
│   │   ├── parseQuickEntry.js   # Smart text parser
│   │   ├── currency.js          # BDT formatting
│   │   └── date.js              # BDT timezone dates
│   └── data/
│       ├── translations.js      # en/bn strings
│       └── medicines.json       # 150+ seeded medicines
├── scripts/
│   ├── scrape-medex.js          # MedEx scraper (run once)
│   └── seed-medicines.js        # Process raw → medicines.json
└── functions/                   # Firebase Cloud Functions
    ├── package.json
    ├── index.js                 # Webhooks + scheduled backup
    └── telegram.js              # Telegram bot handler
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run cap:sync` | Sync web assets to Capacitor |
| `npm run cap:run:android` | Build & run APK on device |
| `npm run cap:open:android` | Open in Android Studio |
| `npm run scrape:medex` | Scrape MedEx (takes ~5-10 min) |
| `npm run seed:medicines` | Process scraped data → medicines.json |
| `npm run functions:deploy` | Deploy Firebase Functions |

## Development Notes

- **Timezone**: All dates use Asia/Dhaka (BDT, UTC+6)
- **Currency**: Stored as integer taka (৳), displayed with Indian numbering (1,00,000)
- **Offline**: Firestore listeners cache to localStorage; works offline
- **PIN**: Stored in localStorage (plain text — for production, use Web Crypto API)
- **Medicine Autocomplete**: Loads from `medicines.json` + localStorage custom meds
- **Quick Entry Parser**: Handles formats like:
  - `napa 10 12`
  - `seclo 20 pc 140`
  - `napa 10pcs 12tk`
  - `paracetamol 5 box 500`

## License
Private project.