/**
 * Inline Result Display - Shows results inline below action buttons
 */
class InlineResultDisplay {
  constructor() {
    this.currentResults = new Map(); // action -> result element
  }

  showResult(action, text, title = 'AI Result') {
    console.log('InboxPilot: InlineResultDisplay.showResult called:', { action, text, title });
    
    // Try to find actions bar with retry
    let actionsBar = document.querySelector('.inboxpilot-email-actions');
    if (!actionsBar) {
      console.warn('InboxPilot: Actions bar not found immediately, retrying...');
      // Wait a bit and retry (sometimes DOM updates are delayed)
      setTimeout(() => {
        actionsBar = document.querySelector('.inboxpilot-email-actions');
        if (actionsBar) {
          this._insertResult(actionsBar, action, text, title);
        } else {
          console.error('InboxPilot: Actions bar still not found after retry');
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
    
    const header = document.createElement('div');
    header.className = 'inboxpilot-inline-header';
    
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
    
    if (!textContent || textContent.trim().length === 0) {
      console.error('InboxPilot: Empty text content provided to showResult');
      return;
    }
    
    resultContainer.appendChild(header);
    resultContainer.appendChild(content);
    
    // Insert after actions bar
    if (actionsBar.parentNode) {
      try {
        // Try inserting after actions bar
        if (actionsBar.nextSibling) {
          actionsBar.parentNode.insertBefore(resultContainer, actionsBar.nextSibling);
        } else {
          actionsBar.parentNode.appendChild(resultContainer);
        }
        console.log('InboxPilot: Result container inserted successfully after actions bar');
        console.log('InboxPilot: Result container element:', resultContainer);
        console.log('InboxPilot: Text content length:', textContent.length);
        
        // Force visibility and ensure it's displayed
        resultContainer.style.display = 'block';
        resultContainer.style.visibility = 'visible';
        resultContainer.style.opacity = '1';
        
        this.currentResults.set(action, resultContainer);
        
        // Log for debugging
        setTimeout(() => {
          const rect = resultContainer.getBoundingClientRect();
          console.log('InboxPilot: Result container position:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          });
        }, 100);
      } catch (error) {
        console.error('InboxPilot: Error inserting result container:', error);
        // Fallback: try appending to parent
        try {
          actionsBar.parentNode.appendChild(resultContainer);
          console.log('InboxPilot: Result container appended as fallback');
          resultContainer.style.display = 'block';
          resultContainer.style.visibility = 'visible';
        } catch (fallbackError) {
          console.error('InboxPilot: Fallback insertion also failed:', fallbackError);
        }
      }
    } else {
      console.error('InboxPilot: Actions bar parent node not found, cannot insert result');
      console.error('InboxPilot: Actions bar:', actionsBar);
    }
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

