// Inject the UI script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injectedUI.js');
script.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from injected script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (event.data.type && event.data.type.startsWith('INBOXPILOT_')) {
    handleMessage(event.data);
  }
});

async function handleMessage(data) {
  switch (data.type) {
    case 'INBOXPILOT_GET_EMAIL_CONTENT':
      const emailContent = extractEmailContent();
      window.postMessage({ type: 'INBOXPILOT_EMAIL_CONTENT', content: emailContent }, '*');
      break;
    case 'INBOXPILOT_GET_TOKEN':
      // Get token from background script via message passing
      // Content scripts can't access chrome.storage directly, must use message passing
      chrome.runtime.sendMessage({ type: 'INBOXPILOT_GET_TOKEN' }, (response) => {
        const token = response?.token || null;
        // Store in localStorage for direct access by injected script
        if (token) {
          try {
            localStorage.setItem('inboxpilot_authToken', token);
          } catch (e) {
            console.warn('InboxPilot: Could not store token in localStorage:', e);
          }
        }
        window.postMessage({ 
          type: 'INBOXPILOT_TOKEN_RESPONSE', 
          token: token 
        }, '*');
      });
      break;
    case 'INBOXPILOT_INJECT_UI':
      // UI injection is handled by injectedUI.js
      break;
  }
}

function extractEmailContent() {
  // Extract email content from Gmail DOM
  const emailBody = document.querySelector('.a3s') || document.querySelector('[role="main"]');
  const subject = document.querySelector('h2.hP')?.textContent || '';
  const from = document.querySelector('.gD')?.textContent || '';
  const to = document.querySelector('.g2')?.textContent || '';

  return {
    subject,
    from,
    to,
    body: emailBody?.innerText || emailBody?.textContent || '',
    html: emailBody?.innerHTML || '',
  };
}

// Watch for Gmail navigation
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    window.postMessage({ type: 'INBOXPILOT_NAVIGATION', url }, '*');
  }
}).observe(document, { subtree: true, childList: true });

