// Popup script for InboxPilot extension
document.addEventListener('DOMContentLoaded', () => {
  const openGmailBtn = document.getElementById('openGmail');
  const settingsBtn = document.getElementById('settings');
  const statusDiv = document.getElementById('status');
  const tokenInput = document.getElementById('tokenInput');
  const connectBtn = document.getElementById('connectBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');

  // Shared helper to connect using a given token (from URL or manual input)
  async function connectWithToken(token) {
    if (!token) {
      if (statusDiv) {
        statusDiv.textContent = 'Missing token. Please sign in again on the InboxPilot website.';
        statusDiv.style.background = '#fee2e2';
      }
      return;
    }

    try {
      // Store token in extension storage via background script
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'INBOXPILOT_AUTH', token }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          if (response && response.success) {
            resolve(true);
          } else {
            reject(new Error(response?.error || 'Failed to store token'));
          }
        });
      });

      // Inform backend that extension is connected for this user
      try {
        await fetch('http://localhost:5000/api/auth/extension/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
      } catch (e) {
        // Swallow network errors here; UI will still show as connected from extension side
        console.warn('InboxPilot: Backend connect call failed (will rely on next successful API call):', e);
      }

      if (statusDiv) {
        statusDiv.textContent = 'Gmail connected. You can use InboxPilot in your inbox.';
        statusDiv.style.background = '#e6f7e6';
      }
    } catch (error) {
      console.error('InboxPilot: Error connecting extension:', error);
      if (statusDiv) {
        statusDiv.textContent = 'Failed to connect. Please open InboxPilot on the web and try again.';
        statusDiv.style.background = '#fee2e2';
      }
    }
  }

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

  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      const token = (tokenInput.value || '').trim();
      if (!token) {
        if (statusDiv) {
          statusDiv.textContent = 'Please generate a new login from the InboxPilot website.';
          statusDiv.style.background = '#fee2e2';
        }
        return;
      }

      await connectWithToken(token);
    });
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async () => {
      try {
        // Get current token from storage (if any)
        const token = await new Promise((resolve) => {
          chrome.storage.local.get(['authToken'], (result) => {
            resolve(result?.authToken || null);
          });
        });

        // Clear token via background script
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'INBOXPILOT_AUTH', token: '' }, () => resolve(true));
        });

        // Tell backend to mark extension as disconnected
        if (token) {
          await fetch('http://localhost:5000/api/auth/extension/disconnect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          }).catch(() => {});
        }

        if (statusDiv) {
          statusDiv.textContent = 'Disconnected. InboxPilot UI will be hidden in Gmail.';
          statusDiv.style.background = '#fee2e2';
        }
        if (tokenInput) {
          tokenInput.value = '';
        }
      } catch (error) {
        console.error('InboxPilot: Error disconnecting extension:', error);
        if (statusDiv) {
          statusDiv.textContent = 'Error disconnecting. Please try again.';
          statusDiv.style.background = '#fee2e2';
        }
      }
    });
  }

  // Check backend status (only if we have permission)
  try {
    fetch('http://localhost:5000/health', {
      method: 'GET',
      mode: 'no-cors', // Avoid CORS errors in popup
    })
      .then(() => {
        if (statusDiv) {
          statusDiv.textContent = 'Backend running. You can connect your Gmail account.';
          statusDiv.style.background = '#e6f7e6';
        }
      })
      .catch(() => {
        if (statusDiv) {
          statusDiv.textContent = 'Unable to reach backend. Start the server, then try again.';
          statusDiv.style.background = '#fee2e2';
        }
      });
  } catch (error) {
    if (statusDiv) {
      statusDiv.textContent = 'Ready to use in Gmail.';
    }
  }

  // Auto-connect path for one-click flow: token passed via popup URL
  try {
    const params = new URLSearchParams(window.location.search);
    const urlToken = (params.get('token') || '').trim();
    if (urlToken) {
      // Clear token from input to avoid confusion
      if (tokenInput) {
        tokenInput.value = '';
      }
      connectWithToken(urlToken);
    }
  } catch (e) {
    console.warn('InboxPilot: Failed to parse token from URL:', e);
  }
});

