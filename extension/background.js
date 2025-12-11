// Background service worker for InboxPilot extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('InboxPilot AI extension installed');
});

// Handle messages from content scripts and injected scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.type === 'INBOXPILOT_AUTH') {
      // Store or clear auth token
      const value = request.token && request.token.trim().length > 0 ? request.token : null;
      if (value) {
        chrome.storage.local.set({ authToken: value }, () => {
          if (chrome.runtime.lastError) {
            console.error('InboxPilot: Error storing token:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true });
          }
        });
      } else {
        chrome.storage.local.remove('authToken', () => {
          if (chrome.runtime.lastError) {
            console.error('InboxPilot: Error clearing token:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true });
          }
        });
      }
      return true; // Keep channel open for async response
    }

    if (request.type === 'INBOXPILOT_GET_TOKEN') {
      chrome.storage.local.get(['authToken'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('InboxPilot: Error getting token:', chrome.runtime.lastError);
          sendResponse({ token: null });
        } else {
          sendResponse({ token: result.authToken || null });
        }
      });
      return true; // Keep channel open for async response
    }

    if (request.type === 'INBOXPILOT_API_CALL') {
      // Handle API calls from injected scripts
      // This allows the background script to make fetch calls to localhost
      console.log('InboxPilot: Received API call request:', request.endpoint);
      handleAPICall(request.endpoint, request.data, request.token)
        .then((result) => {
          console.log('InboxPilot: API call succeeded');
          sendResponse({ success: true, data: result });
        })
        .catch((error) => {
          console.error('InboxPilot: API call error:', error);
          sendResponse({ success: false, error: error.message || 'Unknown error occurred' });
        });
      return true; // Keep channel open for async response
    }
  } catch (error) {
    console.error('InboxPilot: Error handling message:', error);
    sendResponse({ error: error.message });
  }
  
  // Return false if we don't handle the message
  return false;
});

// Handle API calls to the backend server
async function handleAPICall(endpoint, data, token) {
  const baseURL = 'http://localhost:5000/api';
  const url = `${baseURL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    console.log('InboxPilot: Making API call to', url, 'with data:', data);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout (less than client timeout)
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('InboxPilot: API error response:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('InboxPilot: API call successful');
    return result;
  } catch (error) {
    console.error('InboxPilot: API call failed:', error);
    
    // Provide more helpful error messages
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout. Make sure the server is running and responding at ${baseURL}`);
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(`Cannot connect to backend. Make sure the server is running at ${baseURL}`);
    }
    if (error.message.includes('ECONNREFUSED')) {
      throw new Error(`Connection refused. Make sure the server is running at ${baseURL}`);
    }
    throw error;
  }
}

// Note: contentScript.js is automatically injected via manifest.json
// No need to manually inject it here

