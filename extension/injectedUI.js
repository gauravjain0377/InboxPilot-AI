/**
 * InboxPilot UI - Main orchestrator for Gmail extension
 * Refactored into modular components for better maintainability
 */
(function() {
  'use strict';

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
