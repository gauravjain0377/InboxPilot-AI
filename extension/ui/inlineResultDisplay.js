/**
 * Inline Result Display - Shows results inline below action buttons
 */
class InlineResultDisplay {
  constructor() {
    this.currentResults = new Map(); // action -> result element

    // Global click handler to close inline result when header is clicked
    document.addEventListener('click', (event) => {
      const header = event.target.closest('.inboxpilot-inline-header');
      if (!header) return;
      const container = header.closest('.inboxpilot-inline-result');
      if (!container) return;
      try {
        container.remove();
        console.log('InboxPilot: Inline result closed via header click');
      } catch (e) {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    });
  }

  showResult(action, text, title = 'AI Result') {
    // Check if we're in email view, not inbox list
    const isEmailView = () => {
      const emailBody = document.querySelector('.a3s') || 
                       document.querySelector('[role="article"] .a3s');
      const emailHeader = document.querySelector('h2.hP') || 
                         document.querySelector('[data-thread-perm-id]');
      if (!emailBody || !emailHeader) {
        return false;
      }
      const bodyText = emailBody.textContent || emailBody.innerText || '';
      return bodyText.trim().length >= 20;
    };
    
    if (!isEmailView()) {
      console.log('InboxPilot: Not in email view, skipping result display');
      return;
    }
    
    console.log('InboxPilot: InlineResultDisplay.showResult called:', { action, text: text ? text.substring(0, 100) + '...' : 'null', title });
    console.log('InboxPilot: Text type:', typeof text);
    console.log('InboxPilot: Text length:', text ? text.length : 0);
    
    // Ensure headers have close buttons (safety net in case of legacy DOM)
    this._ensureInlineCloseButtons();
    
    // Validate text input
    if (!text || (typeof text === 'string' && text.trim().length === 0)) {
      console.error('InboxPilot: Invalid or empty text provided to showResult');
      this.showError(action, 'No content to display');
      return;
    }
    
    // Check if result already exists for this action - if so, just update it
    const existingResult = this.currentResults.get(action);
    if (existingResult && existingResult.parentNode) {
      console.log('InboxPilot: Result already exists for action, updating content:', action);
      // Update existing result content instead of creating new one
      const contentDiv = existingResult.querySelector('.inboxpilot-inline-content');
      if (contentDiv) {
        const textContent = typeof text === 'string' ? text : String(text || '');
        contentDiv.textContent = textContent;
        // Update title if needed
        const titleDiv = existingResult.querySelector('.inboxpilot-inline-title');
        if (titleDiv) {
          titleDiv.textContent = title;
        }
        // Make sure it's visible
        existingResult.style.display = 'block';
        existingResult.style.visibility = 'visible';
        existingResult.style.opacity = '1';
        return;
      }
    }
    
    // Try to find actions bar with retry
    let actionsBar = document.querySelector('.inboxpilot-email-actions');
    console.log('InboxPilot: Actions bar found:', !!actionsBar);
    
    if (!actionsBar) {
      console.warn('InboxPilot: Actions bar not found immediately, retrying...');
      // Wait a bit and retry (sometimes DOM updates are delayed)
      setTimeout(() => {
        actionsBar = document.querySelector('.inboxpilot-email-actions');
        console.log('InboxPilot: Actions bar found after retry:', !!actionsBar);
        if (actionsBar) {
          this._insertResult(actionsBar, action, text, title);
        } else {
          console.error('InboxPilot: Actions bar still not found after retry, trying alternative insertion');
          // Try alternative insertion even without actions bar
          this._insertResultAlternative(null, action, text, title);
        }
      }, 500);
      return;
    }
    
    this._insertResult(actionsBar, action, text, title);

    // As a safety net, ensure all inline headers have a close button
    // even if another path created them without one.
    this._ensureInlineCloseButtons();
  }

  _insertResult(actionsBar, action, text, title) {
    // Remove existing result for this action
    this.removeResult(action);

    const resultContainer = document.createElement('div');
    resultContainer.className = 'inboxpilot-inline-result';
    resultContainer.setAttribute('data-action', action);
    
    // Force visibility with inline styles (highest priority)
    resultContainer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; width: auto !important; height: auto !important; margin: 12px 0 !important; padding: 0 !important;';
    
    const header = document.createElement('div');
    header.className = 'inboxpilot-inline-header';
    header.style.cssText = 'display: flex !important; visibility: visible !important;';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'inboxpilot-inline-title';
    titleDiv.textContent = title;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'inboxpilot-inline-close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.textContent = '×';
    closeBtn.setAttribute('title', 'Close');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; cursor: pointer !important;';
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('InboxPilot: Close button clicked for action:', action);
      this.removeResult(action);
    });
    
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.className = 'inboxpilot-inline-content';
    const textContent = typeof text === 'string' ? text : String(text || '');
    content.textContent = textContent;
    content.style.cssText = 'display: block !important; visibility: visible !important;';
    
    if (!textContent || textContent.trim().length === 0) {
      console.error('InboxPilot: Empty text content provided to showResult');
      return;
    }
    
    resultContainer.appendChild(header);
    resultContainer.appendChild(content);
    
    // Find a visible parent container
    let insertParent = actionsBar.parentNode;
    let insertAfter = actionsBar;
    
    // Check if parent is visible, if not find a better location
    if (insertParent) {
      const parentRect = insertParent.getBoundingClientRect();
      if (parentRect.width === 0 || parentRect.height === 0) {
        // Parent is hidden, try to find email content area
        const emailContent = document.querySelector('[role="main"]') || 
                            document.querySelector('.nH') ||
                            document.querySelector('.aDP');
        if (emailContent) {
          insertParent = emailContent;
          insertAfter = actionsBar;
        }
      }
    }
    
    // Insert after actions bar
    if (insertParent) {
      try {
        // Insert right after actions bar
        if (insertAfter.nextSibling) {
          insertParent.insertBefore(resultContainer, insertAfter.nextSibling);
        } else {
          insertParent.appendChild(resultContainer);
        }
        
        // Force a reflow to ensure rendering
        resultContainer.offsetHeight;
        
        console.log('InboxPilot: Result container inserted successfully');
        console.log('InboxPilot: Text content length:', textContent.length);
        
        this.currentResults.set(action, resultContainer);
        
        // Verify visibility after a short delay
        setTimeout(() => {
          const rect = resultContainer.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(resultContainer);
          console.log('InboxPilot: Result container position:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            visible: rect.width > 0 && rect.height > 0
          });
          
          // If still not visible, try alternative insertion
          if (rect.width === 0 || rect.height === 0) {
            console.warn('InboxPilot: Result container not visible, trying alternative location');
            // Remove the current one and try alternative
            resultContainer.remove();
            this.currentResults.delete(action);
            this._insertResultAlternative(null, action, text, title);
          }
        }, 200);
      } catch (error) {
        console.error('InboxPilot: Error inserting result container:', error);
        // Try alternative insertion with the already-created container
        this._insertResultAlternativeWithContainer(resultContainer, action);
      }
    } else {
      console.error('InboxPilot: No valid parent found for result container');
      // Try alternative insertion with the already-created container
      this._insertResultAlternativeWithContainer(resultContainer, action);
    }
  }

  _insertResultAlternativeWithContainer(resultContainer, action) {
    // Try inserting the already-created container into email content area
    const emailContent = document.querySelector('.a3s') || 
                        document.querySelector('[role="main"] > div') ||
                        document.querySelector('.nH > div') ||
                        document.querySelector('[role="main"]');
    
    console.log('InboxPilot: Trying alternative insertion with existing container, emailContent found:', !!emailContent);
    
    if (emailContent && resultContainer) {
      try {
        // Try to find a good insertion point - after email header or at top of content
        const emailHeader = document.querySelector('h2.hP')?.parentElement;
        if (emailHeader && emailHeader.nextSibling) {
          emailHeader.parentNode.insertBefore(resultContainer, emailHeader.nextSibling);
          console.log('InboxPilot: Result container inserted after email header');
        } else {
          // Insert at the beginning of email content
          if (emailContent.firstChild) {
            emailContent.insertBefore(resultContainer, emailContent.firstChild);
          } else {
            emailContent.appendChild(resultContainer);
          }
          console.log('InboxPilot: Result container inserted in alternative location');
        }
        
        // Force a reflow
        resultContainer.offsetHeight;
        this.currentResults.set(action, resultContainer);
        
        // Verify visibility
        setTimeout(() => {
          const rect = resultContainer.getBoundingClientRect();
          console.log('InboxPilot: Alternative result container position:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          });
        }, 200);
      } catch (error) {
        console.error('InboxPilot: Alternative insertion failed:', error);
      }
    } else {
      console.error('InboxPilot: No email content area found for alternative insertion');
    }
  }

  _insertResultAlternative(actionsBar, action, text, title) {
    // Create new container
    this.removeResult(action);
    const resultContainer = document.createElement('div');
    resultContainer.className = 'inboxpilot-inline-result';
    resultContainer.setAttribute('data-action', action);
    resultContainer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; width: auto !important; height: auto !important; margin: 12px 0 !important; padding: 0 !important;';
    
    const header = document.createElement('div');
    header.className = 'inboxpilot-inline-header';
    header.style.cssText = 'display: flex !important; visibility: visible !important;';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'inboxpilot-inline-title';
    titleDiv.textContent = title;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'inboxpilot-inline-close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.textContent = '×';
    closeBtn.setAttribute('title', 'Close');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; cursor: pointer !important;';
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('InboxPilot: Close button clicked for action:', action);
      this.removeResult(action);
    });
    
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.className = 'inboxpilot-inline-content';
    const textContent = typeof text === 'string' ? text : String(text || '');
    content.textContent = textContent;
    content.style.cssText = 'display: block !important; visibility: visible !important;';
    
    resultContainer.appendChild(header);
    resultContainer.appendChild(content);
    
    // Now insert it using the shared insertion method
    this._insertResultAlternativeWithContainer(resultContainer, action);

    // Safety net for close button
    this._ensureInlineCloseButtons();
  }

  _ensureInlineCloseButtons() {
    try {
      const headers = document.querySelectorAll('.inboxpilot-inline-result .inboxpilot-inline-header');
      headers.forEach((header) => {
        if (header.querySelector('.inboxpilot-inline-close')) return;

        const container = header.closest('.inboxpilot-inline-result');
        const action = container?.getAttribute('data-action') || 'unknown';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'inboxpilot-inline-close';
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.title = 'Close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.style.cssText =
          'display: block !important; visibility: visible !important; opacity: 1 !important; cursor: pointer !important;';

        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('InboxPilot: Close button (fallback) clicked for action:', action);
          if (container && container.parentNode) {
            container.parentNode.removeChild(container);
          }
        });

        header.appendChild(closeBtn);
      });
    } catch (err) {
      console.error('InboxPilot: Error ensuring inline close buttons:', err);
    }
  }

  showError(action, message) {
    // Check if we're in email view
    const isEmailView = () => {
      const emailBody = document.querySelector('.a3s') || 
                       document.querySelector('[role="article"] .a3s');
      return emailBody && (emailBody.textContent || emailBody.innerText || '').trim().length >= 20;
    };
    
    if (!isEmailView()) {
      console.log('InboxPilot: Not in email view, skipping error display');
      return;
    }
    
    const actionsBar = document.querySelector('.inboxpilot-email-actions');
    if (!actionsBar) return;

    this.removeResult(action);

    const errorContainer = document.createElement('div');
    errorContainer.className = 'inboxpilot-inline-result inboxpilot-inline-error';
    errorContainer.setAttribute('data-action', action);
    
    const header = document.createElement('div');
    header.className = 'inboxpilot-inline-header';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'inboxpilot-inline-title';
    titleDiv.textContent = 'Error';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'inboxpilot-inline-close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.textContent = '×';
    closeBtn.setAttribute('title', 'Close');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; cursor: pointer !important;';
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('InboxPilot: Close button clicked for action:', action);
      this.removeResult(action);
    });
    
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.className = 'inboxpilot-inline-content';
    content.textContent = message;
    
    errorContainer.appendChild(header);
    errorContainer.appendChild(content);
    
    actionsBar.parentNode.insertBefore(errorContainer, actionsBar.nextSibling);
    
    this.currentResults.set(action, errorContainer);
  }

  showLoading(action, show) {
    const btn = document.querySelector(`[data-action="${action}"]`);
    if (!btn) {
      console.warn('InboxPilot: Button not found for action:', action);
      return;
    }
    
    if (show) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'wait';
      
      // Show loading indicator in result area
      this._showLoadingIndicator(action);
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      
      // Remove loading indicator
      this._hideLoadingIndicator(action);
    }
  }

  _showLoadingIndicator(action) {
    // Check if we're in email view
    const isEmailView = () => {
      const emailBody = document.querySelector('.a3s') || 
                       document.querySelector('[role="article"] .a3s');
      return emailBody && (emailBody.textContent || emailBody.innerText || '').trim().length >= 20;
    };
    
    if (!isEmailView()) {
      console.log('InboxPilot: Not in email view, skipping loading indicator');
      return;
    }
    
    // Remove any existing result first
    this.removeResult(action);
    
    // Try to find actions bar
    let actionsBar = document.querySelector('.inboxpilot-email-actions');
    if (!actionsBar) {
      // If no actions bar, try to find email content area
      const emailContent = document.querySelector('[role="main"]') || 
                          document.querySelector('.a3s') ||
                          document.querySelector('.nH > div');
      if (emailContent) {
        actionsBar = emailContent;
      } else {
        return; // Can't show loading without a container
      }
    }
    
    // Create loading container
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'inboxpilot-inline-result inboxpilot-loading';
    loadingContainer.setAttribute('data-action', action);
    loadingContainer.setAttribute('data-loading', 'true');
    loadingContainer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; margin: 12px 0 !important; padding: 16px !important;';
    
    const header = document.createElement('div');
    header.className = 'inboxpilot-inline-header';
    header.style.cssText = 'display: flex !important; visibility: visible !important;';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'inboxpilot-inline-title';
    titleDiv.textContent = 'Generating...';
    
    header.appendChild(titleDiv);
    
    const content = document.createElement('div');
    content.className = 'inboxpilot-inline-content';
    content.style.cssText = 'display: flex !important; align-items: center !important; justify-content: center !important; padding: 20px !important;';
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = 'inboxpilot-spinner';
    
    // Create spinner circles using DOM methods instead of innerHTML to avoid TrustedHTML issues
    for (let i = 0; i < 3; i++) {
      const circle = document.createElement('div');
      circle.className = 'inboxpilot-spinner-circle';
      spinner.appendChild(circle);
    }
    
    content.appendChild(spinner);
    
    loadingContainer.appendChild(header);
    loadingContainer.appendChild(content);
    
    // Insert after actions bar or at top of email content
    if (actionsBar.classList.contains('inboxpilot-email-actions')) {
      // Insert after actions bar
      if (actionsBar.nextSibling) {
        actionsBar.parentNode.insertBefore(loadingContainer, actionsBar.nextSibling);
      } else {
        actionsBar.parentNode.appendChild(loadingContainer);
      }
    } else {
      // Insert at beginning of email content
      if (actionsBar.firstChild) {
        actionsBar.insertBefore(loadingContainer, actionsBar.firstChild);
      } else {
        actionsBar.appendChild(loadingContainer);
      }
    }
    
    this.currentResults.set(action, loadingContainer);
  }

  _hideLoadingIndicator(action) {
    const existing = this.currentResults.get(action);
    if (existing && existing.getAttribute('data-loading') === 'true') {
      // Don't remove it here, let showResult replace it
      // Just mark it as not loading
      existing.removeAttribute('data-loading');
    }
  }

  removeResult(action) {
    const existing = this.currentResults.get(action);
    if (existing) {
      console.log('InboxPilot: Removing result for action:', action);
      try {
        existing.remove();
      } catch (error) {
        console.error('InboxPilot: Error removing result element:', error);
        // Try to remove from parent if direct remove fails
        if (existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      }
      this.currentResults.delete(action);
      console.log('InboxPilot: Result removed successfully');
    } else {
      console.log('InboxPilot: No existing result found for action:', action);
    }
  }

  clearAll() {
    this.currentResults.forEach((result) => result.remove());
    this.currentResults.clear();
  }
}

// Ensure it's available globally
try {
  if (typeof window !== 'undefined') {
    window.InlineResultDisplay = InlineResultDisplay;
  }
  console.log('InboxPilot: InlineResultDisplay class defined and registered');
} catch (error) {
  console.error('InboxPilot: Error registering InlineResultDisplay:', error);
}

