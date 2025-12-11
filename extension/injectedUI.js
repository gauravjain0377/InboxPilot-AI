/**
 * InboxPilot UI - Main orchestrator for Gmail extension
 * Refactored into modular components for better maintainability
 */
(function() {
  'use strict';

  function getCurrentGmailEmail() {
    try {
      const accountNode = document.querySelector('a[aria-label*="@"]') || document.querySelector('a[aria-label*="Google Account"]');
      if (!accountNode) return null;
      const label = accountNode.getAttribute('aria-label') || '';
      const match = label.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      return match ? match[0].toLowerCase() : null;
    } catch (e) {
      console.warn('InboxPilot: Could not detect Gmail account email:', e);
      return null;
    }
  }

  // Wait for all dependencies to be loaded
  function waitForDependencies(callback, attempts = 0) {
    const maxAttempts = 100; // 10 seconds max wait (increased from 5)
    
    // Check if all required classes are available (check both global and window scope)
    const allLoaded = (typeof APIService !== 'undefined' || typeof window.APIService !== 'undefined') &&
                     (typeof EmailExtractor !== 'undefined' || typeof window.EmailExtractor !== 'undefined') &&
                     (typeof InlineResultDisplay !== 'undefined' || typeof window.InlineResultDisplay !== 'undefined') &&
                     (typeof ReplyToneSelector !== 'undefined' || typeof window.ReplyToneSelector !== 'undefined') &&
                     (typeof ActionHandlers !== 'undefined' || typeof window.ActionHandlers !== 'undefined') &&
                     (typeof ComposeToolbar !== 'undefined' || typeof window.ComposeToolbar !== 'undefined') &&
                     (typeof EmailActions !== 'undefined' || typeof window.EmailActions !== 'undefined') &&
                     (typeof EmailListFeatures !== 'undefined' || typeof window.EmailListFeatures !== 'undefined') &&
                     (typeof DOMHelpers !== 'undefined' || typeof window.DOMHelpers !== 'undefined');
    
    if (allLoaded) {
      console.log('InboxPilot: All dependencies loaded successfully');
      callback();
    } else if (attempts < maxAttempts) {
      // Log missing dependencies every 10 attempts
      if (attempts % 10 === 0) {
        const missing = [];
        if (typeof APIService === 'undefined' && typeof window.APIService === 'undefined') missing.push('APIService');
        if (typeof EmailExtractor === 'undefined' && typeof window.EmailExtractor === 'undefined') missing.push('EmailExtractor');
        if (typeof InlineResultDisplay === 'undefined' && typeof window.InlineResultDisplay === 'undefined') missing.push('InlineResultDisplay');
        if (typeof ReplyToneSelector === 'undefined' && typeof window.ReplyToneSelector === 'undefined') missing.push('ReplyToneSelector');
        if (typeof ActionHandlers === 'undefined' && typeof window.ActionHandlers === 'undefined') missing.push('ActionHandlers');
        if (typeof ComposeToolbar === 'undefined' && typeof window.ComposeToolbar === 'undefined') missing.push('ComposeToolbar');
        if (typeof EmailActions === 'undefined' && typeof window.EmailActions === 'undefined') missing.push('EmailActions');
        if (typeof EmailListFeatures === 'undefined' && typeof window.EmailListFeatures === 'undefined') missing.push('EmailListFeatures');
        if (typeof DOMHelpers === 'undefined' && typeof window.DOMHelpers === 'undefined') missing.push('DOMHelpers');
        console.log('InboxPilot: Waiting for dependencies...', missing, 'Attempt:', attempts);
        console.log('InboxPilot: Checking window scope:', {
          InlineResultDisplay: typeof window.InlineResultDisplay,
          ReplyToneSelector: typeof window.ReplyToneSelector
        });
      }
      setTimeout(() => waitForDependencies(callback, attempts + 1), 100);
    } else {
      const missing = [];
      if (typeof APIService === 'undefined') missing.push('APIService');
      if (typeof EmailExtractor === 'undefined') missing.push('EmailExtractor');
      if (typeof InlineResultDisplay === 'undefined') missing.push('InlineResultDisplay');
      if (typeof ReplyToneSelector === 'undefined') missing.push('ReplyToneSelector');
      if (typeof ActionHandlers === 'undefined') missing.push('ActionHandlers');
      if (typeof ComposeToolbar === 'undefined') missing.push('ComposeToolbar');
      if (typeof EmailActions === 'undefined') missing.push('EmailActions');
      if (typeof EmailListFeatures === 'undefined') missing.push('EmailListFeatures');
      if (typeof DOMHelpers === 'undefined') missing.push('DOMHelpers');
      console.error('InboxPilot: Failed to load dependencies after', maxAttempts, 'attempts:', missing);
      console.error('InboxPilot: Available classes:', {
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
    }
  }

  // Initialize components after dependencies are loaded
  function initializeComponents() {
    const apiService = new APIService('http://localhost:5000/api');

    // Gate everything on valid token + connected user + matching Gmail account
    (async () => {
      try {
        const token = await apiService.getAuthToken();
        if (!token) {
          console.log('InboxPilot: No auth token found, not injecting UI');
          return;
        }

        let me;
        try {
          me = await apiService.call('/auth/me', {});
        } catch (e) {
          console.warn('InboxPilot: /auth/me failed, not injecting UI:', e?.message || e);
          return;
        }

        const backendEmail = me?.user?.email?.toLowerCase?.() || null;
        const extensionConnected = !!me?.user?.extensionConnected;
        if (!backendEmail || !extensionConnected) {
          console.log('InboxPilot: Extension not connected for this user, skipping UI injection');
          return;
        }

        const gmailEmail = (getCurrentGmailEmail() || '').toLowerCase();
        if (gmailEmail && gmailEmail !== backendEmail) {
          console.log('InboxPilot: Gmail account does not match connected InboxPilot account, skipping UI injection');
          return;
        }

        // Initialize components only after passing all checks
        const emailExtractor = new EmailExtractor();
        const inlineResultDisplay = new InlineResultDisplay();
        const actionHandlers = new ActionHandlers(apiService, emailExtractor, inlineResultDisplay, DOMHelpers);
        const replyToneSelector = new ReplyToneSelector(
          (emailBody, tone, replyWindow, userContext, tokenValue) => {
            return actionHandlers.handleReplyWithTone(emailBody, tone, replyWindow, userContext, tokenValue);
          },
          apiService
        );
        const composeToolbar = new ComposeToolbar((action, composeBox) => {
          actionHandlers.handleComposeAction(action, composeBox);
        });
        const emailActions = new EmailActions((action) => {
          actionHandlers.handleAction(action);
        });
        const emailListFeatures = new EmailListFeatures({
          onRowClick: (row) => {
            // No sidebar, so nothing to do
          },
          onQuickReply: (row) => {
            actionHandlers.quickReply(row);
          },
          onSetPriority: (row, priority) => {
            actionHandlers.setPriority(row, priority);
          }
        });

        class InboxPilotUI {
      constructor(components) {
        this.components = components;
        this.isInitialized = false;
        this.currentEmail = null;
        this.init();
      }

      init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.waitForGmail(() => {
          this.components.composeToolbar.inject();
          this.components.emailActions.inject();
          this.components.emailListFeatures.inject();
          this.observeGmailChanges();
        });
      }

      waitForGmail(callback) {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkGmail = () => {
          attempts++;
          if (document.querySelector('[role="main"]') && document.body) {
            callback();
          } else if (attempts < maxAttempts) {
            setTimeout(checkGmail, 500);
          } else {
            console.warn('InboxPilot: Gmail not detected after timeout');
          }
        };
        checkGmail();
      }

      observeGmailChanges() {
        // Watch for navigation changes - use multiple methods for reliability
        let lastUrl = location.href;
        
        // Method 1: Listen to navigation messages from contentScript
        window.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'INBOXPILOT_NAVIGATION') {
            console.log('InboxPilot: Navigation detected, re-injecting components');
            this.reinjectComponents();
          }
        });
        
        // Method 2: Watch URL changes directly
        const urlObserver = new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            lastUrl = url;
            console.log('InboxPilot: URL changed, re-injecting components');
            this.reinjectComponents();
          }
        });
        urlObserver.observe(document, { subtree: true, childList: true });
        
        // Method 3: Also listen to popstate (back/forward) and hashchange
        window.addEventListener('popstate', () => {
          console.log('InboxPilot: Popstate event, re-injecting components');
          setTimeout(() => this.reinjectComponents(), 500);
        });
        window.addEventListener('hashchange', () => {
          console.log('InboxPilot: Hash change, re-injecting components');
          setTimeout(() => this.reinjectComponents(), 500);
        });
        
        // Method 4: Watch for Gmail's tab switching (Primary/Promotions/Social tabs)
        const mainArea = document.querySelector('[role="main"]');
        if (mainArea) {
          const tabObserver = new MutationObserver(() => {
            // Check if email list container was replaced (common on tab switch)
            const emailList = document.querySelector('div[role="main"] > div > div[role="tabpanel"]');
            if (emailList) {
              console.log('InboxPilot: Email list changed, re-injecting components');
              setTimeout(() => this.reinjectComponents(), 300);
            }
          });
          tabObserver.observe(mainArea, { childList: true, subtree: true });
        }
      }
      
      reinjectComponents() {
        // Clear processed markers so rows are re-processed
        try {
          document.querySelectorAll('[data-inboxpilot-processed]').forEach(el => {
            el.removeAttribute('data-inboxpilot-processed');
          });
        } catch (e) {
          console.warn('InboxPilot: Error clearing processed markers:', e);
        }
        
        // Re-inject all components
        try {
          this.components.composeToolbar.inject();
          this.components.emailActions.inject();
          this.components.emailListFeatures.inject();
        } catch (e) {
          console.error('InboxPilot: Error re-injecting components:', e);
        }
      }
        }

        // Store components globally
        window.inboxPilotComponents = {
          apiService,
          emailExtractor,
          inlineResultDisplay,
          actionHandlers,
          replyToneSelector,
          composeToolbar,
          emailActions,
          emailListFeatures
        };
        
        // Make replyToneSelector globally available
        window.replyToneSelector = replyToneSelector;
        
        // Also make composeToolbar globally available for manual injection if needed
        window.composeToolbar = composeToolbar;

        // Initialize when DOM is ready
        function initInboxPilot() {
          try {
            if (document.body && document.querySelector('[role="main"]')) {
              new InboxPilotUI(window.inboxPilotComponents);
            } else {
              setTimeout(initInboxPilot, 500);
            }
          } catch (error) {
            console.error('InboxPilot: Initialization error:', error);
          }
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initInboxPilot);
        } else {
          initInboxPilot();
        }
      } catch (err) {
        console.error('InboxPilot: Error during initialization gating:', err);
      }
    })();
  }

  // Wait for dependencies before initializing
  waitForDependencies(initializeComponents);
})();
