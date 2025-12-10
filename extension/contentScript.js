// Inject all component scripts in order, then the main UI script
function injectScripts(attempts = 0) {
  const maxAttempts = 10;
  
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    console.warn('InboxPilot: Extension context invalid, cannot inject scripts. Please reload the page after reloading the extension.');
    return;
  }
  
  if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
    try {
      // Load scripts in dependency order
      const scripts = [
        'services/apiService.js',
        'services/emailExtractor.js',
        'utils/domHelpers.js',
        'ui/sidebar.js',
        'ui/resultDisplay.js',
        'ui/composeToolbar.js',
        'ui/emailActions.js',
        'ui/emailListFeatures.js',
        'services/actionHandlers.js',
        'injectedUI.js' // Main script loads last
      ];

      let currentIndex = 0;

      function loadNext() {
        if (currentIndex >= scripts.length) {
          console.log('InboxPilot: All scripts loaded successfully');
          // Small delay to ensure all classes are defined
          setTimeout(() => {
            console.log('InboxPilot: Checking for classes:', {
              APIService: typeof APIService,
              EmailExtractor: typeof EmailExtractor,
              SidebarUI: typeof SidebarUI,
              ResultDisplay: typeof ResultDisplay,
              ActionHandlers: typeof ActionHandlers,
              ComposeToolbar: typeof ComposeToolbar,
              EmailActions: typeof EmailActions,
              EmailListFeatures: typeof EmailListFeatures,
              DOMHelpers: typeof DOMHelpers
            });
          }, 100);
          return; // All scripts loaded
        }

        // Check context validity before each script load
        if (!isExtensionContextValid()) {
          console.warn('InboxPilot: Extension context invalidated during script loading');
          return;
        }
        
        const script = document.createElement('script');
        let scriptUrl;
        try {
          scriptUrl = chrome.runtime.getURL(scripts[currentIndex]);
        } catch (e) {
          console.error('InboxPilot: Error getting script URL:', e);
          currentIndex++;
          loadNext();
          return;
        }
        script.src = scriptUrl;
        
        script.onload = function() {
          console.log('InboxPilot: Loaded script:', scripts[currentIndex]);
          // Don't remove immediately - wait a bit to ensure class definitions are available
          setTimeout(() => {
            try {
              this.remove();
            } catch (e) {
              // Ignore errors when removing script
            }
          }, 50);
          currentIndex++;
          loadNext(); // Load next script
        };
        
        script.onerror = function() {
          console.error('InboxPilot: Failed to load script:', scriptUrl);
          currentIndex++;
          loadNext(); // Continue even if one fails
        };
        
        try {
          (document.head || document.documentElement).appendChild(script);
        } catch (e) {
          console.error('InboxPilot: Error appending script:', e);
          currentIndex++;
          loadNext();
        }
      }

      loadNext();
    } catch (error) {
      console.error('InboxPilot: Error injecting scripts:', error);
    }
  } else if (attempts < maxAttempts) {
    setTimeout(() => injectScripts(attempts + 1), 100);
  } else {
    console.error('InboxPilot: chrome.runtime.getURL not available after', maxAttempts, 'attempts.');
  }
}

// Check if extension context is still valid before operations
function isExtensionContextValid() {
  try {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id !== undefined;
  } catch (e) {
    return false;
  }
}

// Start injection when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => injectScripts());
} else {
  injectScripts();
}

// Listen for extension reload/unload
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.warn('InboxPilot: Extension context disconnected');
      }
    });
  });
}

// Listen for messages from injected script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (event.data.type && event.data.type.startsWith('INBOXPILOT_')) {
    handleMessage(event.data);
  }
});

async function handleMessage(data) {
  try {
    switch (data.type) {
      case 'INBOXPILOT_GET_EMAIL_CONTENT':
        const emailContent = extractEmailContent();
        window.postMessage({ type: 'INBOXPILOT_EMAIL_CONTENT', content: emailContent }, '*');
        break;
      case 'INBOXPILOT_GET_TOKEN':
        // Get token from background script via message passing
        // Content scripts can't access chrome.storage directly, must use message passing
        
        // First check if extension context is valid
        if (!isExtensionContextValid()) {
          console.warn('InboxPilot: Extension context invalid, using cached token or null');
          const cachedToken = localStorage.getItem('inboxpilot_authToken');
          window.postMessage({ 
            type: 'INBOXPILOT_TOKEN_RESPONSE', 
            token: cachedToken || null 
          }, '*');
          break;
        }
        
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          try {
            chrome.runtime.sendMessage({ type: 'INBOXPILOT_GET_TOKEN' }, (response) => {
              // Check for extension context errors
              if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message;
                // Only log if it's not the common "Extension context invalidated" error
                if (!errorMsg.includes('Extension context invalidated')) {
                  console.warn('InboxPilot: Extension context error:', errorMsg);
                }
                // Try to use cached token from localStorage
                const cachedToken = localStorage.getItem('inboxpilot_authToken');
                window.postMessage({ 
                  type: 'INBOXPILOT_TOKEN_RESPONSE', 
                  token: cachedToken || null 
                }, '*');
                return;
              }
              
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
          } catch (error) {
            // Handle any errors gracefully
            console.warn('InboxPilot: Error getting token:', error);
            const cachedToken = localStorage.getItem('inboxpilot_authToken');
            window.postMessage({ 
              type: 'INBOXPILOT_TOKEN_RESPONSE', 
              token: cachedToken || null 
            }, '*');
          }
        } else {
          // If chrome.runtime is not available, try cached token
          const cachedToken = localStorage.getItem('inboxpilot_authToken');
          window.postMessage({ 
            type: 'INBOXPILOT_TOKEN_RESPONSE', 
            token: cachedToken || null 
          }, '*');
        }
        break;
      case 'INBOXPILOT_INJECT_UI':
        // UI injection is handled by injectedUI.js
        break;
    }
  } catch (error) {
    console.error('InboxPilot: Error in handleMessage:', error);
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

