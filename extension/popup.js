// Popup script for InboxPilot extension
document.addEventListener('DOMContentLoaded', () => {
  const openGmailBtn = document.getElementById('openGmail');
  const settingsBtn = document.getElementById('settings');
  const statusDiv = document.getElementById('status');
  const tokenInput = document.getElementById('tokenInput');
  const connectBtn = document.getElementById('connectBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  
  // Check for pending connection token from Settings page
  const checkForPendingToken = async () => {
    try {
      // Get token from URL params (legacy method, if extension was opened with ?token=...)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      if (urlToken) {
        console.log('InboxPilot: Found token in URL, auto-connecting...');
        await connectWithToken(urlToken);
        // Clear URL param for privacy
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // New method: Check localStorage from Settings page (requires content script bridge)
      // Since popup can't access webpage localStorage directly, we'll check via background script
      // which can communicate with content scripts
      chrome.runtime.sendMessage({ type: 'INBOXPILOT_GET_PENDING_TOKEN' }, async (response) => {
        if (chrome.runtime.lastError) {
          // Background script might not be ready, ignore
          return;
        }
        
        const pendingToken = response?.token || null;
        const timestamp = response?.timestamp || null;
        
        if (pendingToken && timestamp) {
          // Token must be less than 5 minutes old
          const age = Date.now() - parseInt(timestamp, 10);
          if (age < 5 * 60 * 1000) {
            console.log('InboxPilot: Found pending connection token, auto-connecting...');
            await connectWithToken(pendingToken);
            
            // Clear the pending token
            chrome.runtime.sendMessage({ type: 'INBOXPILOT_CLEAR_PENDING_TOKEN' }, () => {});
          } else {
            console.log('InboxPilot: Pending token expired');
          }
        }
      });
    } catch (error) {
      console.error('InboxPilot: Error checking for pending token:', error);
    }
  };
  
  // Run check immediately on load
  checkForPendingToken();

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
      let connectSuccess = false;
      try {
        const response = await fetch('http://localhost:5000/api/auth/extension/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        connectSuccess = result.success === true;
        
        if (connectSuccess) {
          console.log('InboxPilot: Successfully marked extension as connected in backend');
        } else {
          throw new Error('Backend returned success: false');
        }
      } catch (e) {
        console.error('InboxPilot: Backend connect call failed:', e);
        if (statusDiv) {
          statusDiv.textContent = `Connection saved locally, but backend update failed: ${e.message}. Refresh the dashboard page to see updated status.`;
          statusDiv.style.background = '#fff3cd';
        }
        // Don't throw - token is stored, just backend status update failed
        return;
      }

      if (statusDiv) {
        statusDiv.textContent = 'Gmail connected! Refresh the dashboard page to see updated status.';
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

