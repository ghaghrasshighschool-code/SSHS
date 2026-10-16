# SS+2 High School Ghaghra - Study Notes Portal (PWA)

A Progressive Web App (PWA) for students of Classes 9th, 10th, 11th, and 12th of SS+2 High School Ghaghra to view and download study notes, revision materials, and syllabus chapters offline on Android.

## Features
- **4-Quadrant Diamond Selector**: Interactive visual class navigator for Classes 9th, 10th, 11th, and 12th.
- **PWA for Android**: Installable directly from Android Chrome with an app icon and standalone fullscreen experience.
- **100% Offline Study**: Service Worker pre-caches the app shell and caches accessed PDF notes so students can study without internet data.
- **Built-in PDF Viewer & Downloader**: View notes in-app or download directly to Android storage.
- **Admin Portal (`admin.html`)**: Password-protected portal for teachers to upload new PDF notes, manage subjects, and post announcements.
- **Zero-Risk Security Hardened**: Full DOM XSS sanitization, PDF binary magic byte verification, SHA-256 PIN hashing, anti-brute-force rate limiting, and strict Content Security Policy.

## Project Structure
```
├── index.html            # Main Student App Shell & Diamond Navigator
├── admin.html            # Teacher & Staff Upload Portal
├── manifest.webmanifest  # PWA Android Manifest
├── sw.js                 # Offline Service Worker (v4)
├── css/
│   ├── styles.css        # Mobile-first responsive app styling
│   └── admin.css         # Admin dashboard styling
├── js/
│   ├── app.js            # Student UI controller
│   ├── admin.js          # Admin upload and management logic
│   ├── data.js           # Structured notes library
│   ├── security.js       # Zero-risk security & sanitization engine
│   ├── storage.js        # Shared IndexedDB & LocalStorage layer
│   └── sw-register.js    # PWA install prompt & standalone detector
├── icons/                # PWA app icons (192x192, 512x512)
└── notes/                # Sample and uploaded PDF documents
```

## Running Locally
```bash
python3 -m http.server 5500
```
Open `http://127.0.0.1:5500` in your browser.
