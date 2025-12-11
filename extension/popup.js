// Popup script for InboxPilot extension
document.addEventListener('DOMContentLoaded', () => {
  const openGmailBtn = document.getElementById('openGmail');
  const settingsBtn = document.getElementById('settings');
  const statusDiv = document.getElementById('status');
  
  if (openGmailBtn) {
    openGmailBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://mail.google.com' });
    });
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3000/settings' });
    });
  }
  
  // Check backend status (only if we have permission)
  try {
    fetch('http://localhost:5000/health', { 
      method: 'GET',
      mode: 'no-cors' // Avoid CORS errors in popup
    })
      .then(() => {
        if (statusDiv) {
          statusDiv.textContent = 'Backend running ✓';
          statusDiv.style.background = '#e6f7e6';
        }
      })
      .catch(() => {
        // Silently fail - backend might not be running
        if (statusDiv) {
          statusDiv.textContent = 'Click "Open Gmail" to use InboxPilot';
        }
      });
  } catch (error) {
    // Silently ignore fetch errors in popup
    if (statusDiv) {
      statusDiv.textContent = 'Ready to use in Gmail';
    }
  }
});

