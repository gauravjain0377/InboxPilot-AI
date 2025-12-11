/**
 * Inline Result Display - Shows results inline below action buttons
 */
class InlineResultDisplay {
  constructor() {
    this.currentResults = new Map(); // action -> result element
  }

  showResult(action, text, title = 'AI Result') {
    console.log('InboxPilot: InlineResultDisplay.showResult called:', { action, text: text ? text.substring(0, 100) + '...' : 'null', title });
    console.log('InboxPilot: Text type:', typeof text);
    console.log('InboxPilot: Text length:', text ? text.length : 0);
    
    // Validate text input
    if (!text || (typeof text === 'string' && text.trim().length === 0)) {
      console.error('InboxPilot: Invalid or empty text provided to showResult');
      this.showError(action, 'No content to display');
      return;
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
    closeBtn.addEventListener('click', () => {
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
    closeBtn.addEventListener('click', () => {
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
  }

  showError(action, message) {
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
    closeBtn.addEventListener('click', () => {
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
    if (!btn) return;
    
    if (show) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'wait';
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  }

  removeResult(action) {
    const existing = this.currentResults.get(action);
    if (existing) {
      existing.remove();
      this.currentResults.delete(action);
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

