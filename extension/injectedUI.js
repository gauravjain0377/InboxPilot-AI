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
                     typeof SidebarUI !== 'undefined' &&
                     typeof ResultDisplay !== 'undefined' &&
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
      if (typeof SidebarUI === 'undefined') missing.push('SidebarUI');
      if (typeof ResultDisplay === 'undefined') missing.push('ResultDisplay');
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
    const sidebar = new SidebarUI('inboxpilot-panel');
    const resultDisplay = new ResultDisplay(sidebar);
    const actionHandlers = new ActionHandlers(apiService, emailExtractor, resultDisplay, DOMHelpers);
    const composeToolbar = new ComposeToolbar((action, composeBox) => {
      actionHandlers.handleComposeAction(action, composeBox);
    });
    const emailActions = new EmailActions((action) => {
      actionHandlers.handleAction(action.replace('-email', ''), sidebar);
    });
    const emailListFeatures = new EmailListFeatures({
      onRowClick: (row) => {
        window.updateSidebarWithEmail(row);
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
          this.setupSidebar();
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

      setupSidebar() {
        const panel = this.components.sidebar.create();
        if (!panel) return;

        // Setup close button
        const closeBtn = panel.querySelector('.inboxpilot-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
          });
        }

        // Setup action buttons
        panel.querySelectorAll('.inboxpilot-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.inboxpilot-btn');
            if (actionBtn && actionBtn.dataset.action) {
              this.components.actionHandlers.handleAction(actionBtn.dataset.action, this.components.sidebar);
            }
          });
        });
      }

      observeGmailChanges() {
        const observer = new MutationObserver(() => {
          if (this.components.sidebar.panel && this.components.sidebar.panel.style.display !== 'none') {
            this.components.sidebar.panel.style.display = 'block';
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }


    // Store components globally
    window.inboxPilotComponents = {
      apiService,
      emailExtractor,
      sidebar,
      resultDisplay,
      actionHandlers,
      composeToolbar,
      emailActions,
      emailListFeatures
    };

    // Define updateSidebarWithEmail function
    window.updateSidebarWithEmail = function(row) {
      const components = window.inboxPilotComponents;
      if (!components) return;
      
      const subject = row.querySelector('td[class*="bog"]')?.textContent || '';
      const sender = row.querySelector('span[email]')?.getAttribute('email') || '';
      const snippet = row.querySelector('span[class*="bog"]')?.textContent || '';
      
      const labels = components.emailExtractor.detectLabels(subject, snippet);
      components.sidebar.updateEmailInfo(subject, sender, snippet, labels);
    };

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
