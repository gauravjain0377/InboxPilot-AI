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
        'ui/inlineResultDisplay.js',
        'ui/replyToneSelector.js',
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
              InlineResultDisplay: typeof InlineResultDisplay,
              ReplyToneSelector: typeof ReplyToneSelector,
              ActionHandlers: typeof ActionHandlers,
              ComposeToolbar: typeof ComposeToolbar,
              EmailActions: typeof EmailActions,
              EmailListFeatures: typeof EmailListFeatures,
              DOMHelpers: typeof DOMHelpers
            });
          }, 200);
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
          
          // Check if the class was defined (for specific scripts)
          if (scripts[currentIndex].includes('inlineResultDisplay')) {
            setTimeout(() => {
              console.log('InboxPilot: InlineResultDisplay available?', typeof InlineResultDisplay);
            }, 50);
          }
          if (scripts[currentIndex].includes('replyToneSelector')) {
            setTimeout(() => {
              console.log('InboxPilot: ReplyToneSelector available?', typeof ReplyToneSelector);
            }, 50);
          }
          
          // Wait a bit longer to ensure class definitions are available
          setTimeout(() => {
            try {
              this.remove();
            } catch (e) {
              // Ignore errors when removing script
            }
          }, 150);
          currentIndex++;
          loadNext(); // Load next script
        };
        
        script.onerror = function(error) {
          console.error('InboxPilot: Failed to load script:', scriptUrl);
          console.error('InboxPilot: Script path:', scripts[currentIndex]);
          console.error('InboxPilot: Error details:', error);
          console.error('InboxPilot: Make sure the file exists in manifest.json web_accessible_resources');
          currentIndex++;
          loadNext(); // Continue even if one fails
        };
        
        // Add error event listener
        script.addEventListener('error', function(e) {
          console.error('InboxPilot: Script error event for:', scripts[currentIndex], e);
        }, true);
        
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

// Auto-redirect to Gmail inbox if on promotional/landing page
let redirectAttempts = 0;
const MAX_REDIRECT_ATTEMPTS = 2;

function ensureGmailInbox() {
  // Prevent infinite redirect loops
  if (redirectAttempts >= MAX_REDIRECT_ATTEMPTS) {
    return;
  }
  
  const currentUrl = window.location.href;
  
  // Check if we're on a promotional page by looking for specific text
  const hasPromoText = document.body && (
    document.body.textContent.includes('Gmail is better on the app') ||
    document.body.textContent.includes('Secure, fast & organized email')
  );
  
  // Check URL patterns - promotional pages often have /mail/mu/mp/ or similar
  const isPromoUrl = currentUrl.includes('/mail/mu/mp/') || 
                    currentUrl.includes('/mail/mp/');
  
  // Check if we're in a proper inbox view
  const isInboxUrl = currentUrl.includes('/mail/u/') || 
                    currentUrl.includes('/mail/#inbox');
  
  // Only redirect if we're definitely on promotional page
  if ((hasPromoText || isPromoUrl) && !isInboxUrl) {
    redirectAttempts++;
    
    // Try to find and click the inbox link if available
    const allLinks = document.querySelectorAll('a[href]');
    for (let link of allLinks) {
      const href = link.getAttribute('href') || link.href;
      if (href && (href.includes('/mail/u/') || href.includes('/mail/#inbox'))) {
        console.log('InboxPilot: Found inbox link, redirecting...');
        window.location.href = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
        return;
      }
    }
    
    // Fallback: construct inbox URL directly
    if (currentUrl.includes('mail.google.com')) {
      const baseUrl = currentUrl.split('/mail/')[0];
      const inboxUrl = baseUrl + '/mail/u/0/#inbox';
      if (currentUrl !== inboxUrl) {
        console.log('InboxPilot: Redirecting to inbox:', inboxUrl);
        window.location.href = inboxUrl;
        return;
      }
    }
  } else {
    // Reset counter if we're in a good state
    redirectAttempts = 0;
  }
}

// Run redirect check immediately and on DOM ready
ensureGmailInbox();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ensureGmailInbox();
    injectScripts();
  });
} else {
  setTimeout(ensureGmailInbox, 500); // Small delay to let page settle
  injectScripts();
}

// Also watch for URL changes that might redirect away from inbox
let lastCheckedUrl = location.href;
setInterval(() => {
  if (location.href !== lastCheckedUrl) {
    lastCheckedUrl = location.href;
    setTimeout(ensureGmailInbox, 1000);
  }
}, 1000);

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

