// PWA Service Worker Registration & Android Install Prompt Handler

let deferredPrompt = null;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

// Check if running in Standalone PWA mode (Already Installed)
function checkStandaloneMode() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone || 
                       document.referrer.includes('android-app://');

  if (isStandalone) {
    const promptBanner = document.getElementById('pwaInstallPrompt');
    const promptBtn = document.getElementById('pwaPromptBtn');
    if (promptBtn) {
      promptBtn.innerHTML = '<span>✅</span> Installed';
      promptBtn.style.background = '#059669';
      promptBtn.style.color = '#ffffff';
      promptBtn.onclick = () => showToast('✅ SSHS Notes App is already installed and running offline!');
    }
    const desc = document.querySelector('.pwa-prompt-desc');
    if (desc) {
      desc.textContent = 'App installed • Offline notes library ready';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkStandaloneMode();
});

// Capture Android "beforeinstallprompt" event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] captured beforeinstallprompt event');

  const promptBtn = document.getElementById('pwaPromptBtn');
  if (promptBtn) {
    promptBtn.classList.add('pulse');
  }
});

// Function to trigger Android App installation
function triggerPwaInstall() {
  // If already installed and opened as app
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) {
    showToast('✅ SSHS Notes App is already installed and ready for offline study!');
    return;
  }

  // If native install prompt event was captured
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        showToast('🎉 Installing SSHS Notes App...');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  } else {
    // Show visual step-by-step installation guide modal
    openInstallGuide();
  }
}

// Backward compatibility alias
function installApp() {
  triggerPwaInstall();
}

// Install Guide Modal Controls
function openInstallGuide() {
  const modal = document.getElementById('installGuideModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    showToast('💡 In Chrome: Tap 3 dots (⋮) at top-right -> Tap "Install app" or "Add to Home screen"');
  }
}

function closeInstallGuide() {
  const modal = document.getElementById('installGuideModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Detect when successfully installed
window.addEventListener('appinstalled', () => {
  console.log('[PWA] SSHS Notes App installed successfully');
  showToast('✅ App successfully installed on your phone!');
  const promptBtn = document.getElementById('pwaPromptBtn');
  if (promptBtn) {
    promptBtn.innerHTML = '<span>✅</span> Installed';
    promptBtn.style.background = '#059669';
    promptBtn.style.color = '#ffffff';
  }
});
