/**
 * Inline Result Display - Shows results inline below action buttons
 */
class InlineResultDisplay {
  constructor() {
    this.currentResults = new Map(); // action -> result element
  }

  showResult(action, text, title = 'AI Result') {
    const actionsBar = document.querySelector('.inboxpilot-email-actions');
    if (!actionsBar) return;

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
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('title', 'Close');
    closeBtn.addEventListener('click', () => {
      this.removeResult(action);
    });
    
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.className = 'inboxpilot-inline-content';
    content.textContent = typeof text === 'string' ? text : String(text || '');
    
    resultContainer.appendChild(header);
    resultContainer.appendChild(content);
    
    // Insert after actions bar
    actionsBar.parentNode.insertBefore(resultContainer, actionsBar.nextSibling);
    
    this.currentResults.set(action, resultContainer);
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
    closeBtn.innerHTML = '×';
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

