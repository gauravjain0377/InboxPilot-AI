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
    return true;
  }

  if (request.type === 'INBOXPILOT_GET_TOKEN') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken });
    });
    return true;
  }
});

// Listen for tab updates to inject on Gmail
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('mail.google.com')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['contentScript.js'],
    });
  }
});

