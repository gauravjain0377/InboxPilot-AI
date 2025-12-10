// Background service worker for InboxPilot extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('InboxPilot AI extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'INBOXPILOT_AUTH') {
    // Store auth token
    chrome.storage.local.set({ authToken: request.token }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }

  if (request.type === 'INBOXPILOT_GET_TOKEN') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken });
    });
    return true; // Keep channel open for async response
  }
  
  // Return false if we don't handle the message
  return false;
});

// Note: contentScript.js is automatically injected via manifest.json
// No need to manually inject it here

