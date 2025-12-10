// Background service worker for InboxPilot extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('InboxPilot AI extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.type === 'INBOXPILOT_AUTH') {
      // Store auth token
      chrome.storage.local.set({ authToken: request.token }, () => {
        if (chrome.runtime.lastError) {
          console.error('InboxPilot: Error storing token:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true });
        }
      });
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
  } catch (error) {
    console.error('InboxPilot: Error handling message:', error);
    sendResponse({ error: error.message });
  }
  
  // Return false if we don't handle the message
  return false;
});

// Note: contentScript.js is automatically injected via manifest.json
// No need to manually inject it here

