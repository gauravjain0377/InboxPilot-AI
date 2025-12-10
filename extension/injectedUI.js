/**
 * InboxPilot UI - Main orchestrator for Gmail extension
 * Refactored into modular components for better maintainability
 */
(function() {
  'use strict';

  // Wait for all dependencies to be loaded
  function waitForDependencies(callback, attempts = 0) {
    const maxAttempts = 50; // 5 seconds max wait
    
    // Check if all required classes are available (they're defined at top level, so they're global)
    const allLoaded = typeof APIService !== 'undefined' &&
                     typeof EmailExtractor !== 'undefined' &&
                     typeof InlineResultDisplay !== 'undefined' &&
                     typeof ReplyToneSelector !== 'undefined' &&
                     typeof ActionHandlers !== 'undefined' &&
                     typeof ComposeToolbar !== 'undefined' &&
                     typeof EmailActions !== 'undefined' &&
                     typeof EmailListFeatures !== 'undefined' &&
                     typeof DOMHelpers !== 'undefined';
    
    if (allLoaded) {
      callback();
    } else if (attempts < maxAttempts) {
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
      console.error('InboxPilot: Failed to load dependencies:', missing);
    }
  }

  // Initialize components after dependencies are loaded
  function initializeComponents() {
    // Initialize components
    const apiService = new APIService('http://localhost:5000/api');
    const emailExtractor = new EmailExtractor();
    const inlineResultDisplay = new InlineResultDisplay();
    const actionHandlers = new ActionHandlers(apiService, emailExtractor, inlineResultDisplay, DOMHelpers);
    const replyToneSelector = new ReplyToneSelector((emailBody, tone, replyWindow) => {
      return actionHandlers.handleReplyWithTone(emailBody, tone, replyWindow);
    });
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
        // Watch for navigation changes
        let lastUrl = location.href;
        const urlObserver = new MutationObserver(() => {
          const url = location.href;
          if (url !== lastUrl) {
            lastUrl = url;
            // Re-inject components on navigation
            setTimeout(() => {
              this.components.composeToolbar.inject();
              this.components.emailActions.inject();
              this.components.emailListFeatures.inject();
            }, 1000);
          }
        });
        urlObserver.observe(document, { subtree: true, childList: true });
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
  }

  // Wait for dependencies before initializing
  waitForDependencies(initializeComponents);
})();
