# SS+2 High School Ghaghra - Study Notes Portal (PWA)

A Progressive Web App (PWA) for students of Classes 9th, 10th, 11th, and 12th of SS+2 High School Ghaghra to view and download study notes, revision materials, and syllabus chapters offline on Android.

## Features
- **4-Quadrant Diamond Selector**: Interactive visual class navigator for Classes 9th, 10th, 11th, and 12th.
- **PWA for Android**: Installable directly from Android Chrome with an app icon and standalone fullscreen experience.
- **100% Self-Hosted & Offline Study**: All PDF documents are stored directly within the website code under `./notes/` (no Google Drive required). Service Worker pre-caches the app shell and hosted PDF notes so students can study completely offline without internet data.
- **Built-in PDF Viewer & Direct Downloader**: View notes in-app or download directly to local storage without third-party cloud blocks.
- **Admin Portal (`admin.html`)**: Password-protected portal for teachers to upload new PDF notes, manage subjects, and post announcements.
- **Zero-Risk Security Hardened**: Full DOM XSS sanitization, PDF binary magic byte verification, SHA-256 PIN hashing, anti-brute-force rate limiting, and strict Content Security Policy.

## Project Structure
```
├── index.html            # Main Student App Shell & Diamond Navigator
├── admin.html            # Teacher & Staff Upload Portal
├── manifest.webmanifest  # PWA Android Manifest
├── sw.js                 # Offline Service Worker (v13)
├── css/
│   ├── styles.css        # Mobile-first responsive app styling
│   └── admin.css         # Admin dashboard styling
├── js/
│   ├── app.js            # Student UI controller
│   ├── admin.js          # Admin upload and management logic
│   ├── data.js           # Structured notes library (142 self-hosted PDFs)
│   ├── security.js       # Zero-risk security & sanitization engine
│   ├── storage.js        # Shared IndexedDB & LocalStorage layer
│   └── sw-register.js    # PWA install prompt & standalone detector
├── icons/                # PWA app icons (192x192, 512x512)
├── notices/              # Official Notice & Circular PDF Documents
└── notes/                # 142 Self-Hosted PDF Notes across 8 Categories
    ├── ALL CLASSES/
    ├── BOOKS/
    ├── DDO(DOMESTIC_DATA_ENTRY_OPERATOR)/
    ├── HTML Notes/
    ├── JSD(JUNIOR_SOFTWARE_DEVELOPER)/
    ├── QUESTION_BANKS/
    ├── QUESTION_PAPERS/
    └── RESOURCES/
```

## Running Locally
```bash
python3 -m http.server 5500
```
Open `http://127.0.0.1:5500` in your browser.
# SSHS
