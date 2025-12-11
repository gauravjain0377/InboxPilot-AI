/**
 * Email Actions Component - Creates action buttons in email view
 */
class EmailActions {
  constructor(actionHandler) {
    this.actionHandler = actionHandler;
    this.observer = null;
  }

  inject() {
    // Initial injection attempt
    setTimeout(() => {
      if (this.isEmailView()) {
        const emailView = document.querySelector('[role="main"]');
        if (emailView && !emailView.querySelector('.inboxpilot-email-actions')) {
          this.create(emailView);
        }
      }
    }, 1000);
    
    // Watch for email view changes
    this.observer = new MutationObserver((mutations) => {
      // Only check if we're viewing an email, not the inbox list
      if (this.isEmailView()) {
        const emailView = document.querySelector('[role="main"]');
        if (emailView && !emailView.querySelector('.inboxpilot-email-actions')) {
          this.create(emailView);
        }
      } else {
        // If we're in inbox view, remove any existing action buttons and results
        const existing = document.querySelector('.inboxpilot-email-actions');
        if (existing) {
          existing.remove();
        }
        // Also remove any inline results that might be showing
        const inlineResults = document.querySelectorAll('.inboxpilot-inline-result');
        inlineResults.forEach(result => result.remove());
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  isEmailView() {
    // Check if we're viewing an individual email (not the inbox list)
    // Multiple checks to be sure
    
    // 1. Check for email body content (most reliable)
    const emailBody = document.querySelector('.a3s') || 
                     document.querySelector('[role="article"] .a3s');
    if (!emailBody) {
      return false;
    }
    
    // 2. Check for email header with subject
    const emailHeader = document.querySelector('h2.hP') || 
                       document.querySelector('[data-thread-perm-id]');
    if (!emailHeader) {
      return false;
    }
    
    // 3. Make sure we're NOT in the inbox list view
    // Inbox list has table rows with emails
    const inboxTable = document.querySelector('table[role="grid"]') ||
                      document.querySelector('table.F.cf.zt');
    if (inboxTable) {
      // Check if we're actually viewing an email thread, not the list
      const emailThreadView = document.querySelector('[role="main"] .nH') ||
                             document.querySelector('[role="main"] .aDP');
      // If we have email body and header, but also a table, check if table is visible
      // In email view, the table should be hidden or not the main content
      const tableRows = inboxTable.querySelectorAll('tr[role="row"]');
      if (tableRows.length > 3) {
        // More than 3 rows suggests we're in inbox list view
        // But if we have email body, we might be in split view
        // So check if email body is actually visible and has content
        const bodyText = emailBody.textContent || emailBody.innerText || '';
        if (bodyText.trim().length < 50) {
          // Email body is too short, probably not a real email view
          return false;
        }
      }
    }
    
    // 4. Check URL - if it contains /#inbox/ or /#search/ without a message ID, it's inbox
    const url = window.location.href;
    if (url.includes('/#inbox') && !url.match(/\/[a-zA-Z0-9]{16,}/)) {
      // In inbox without specific message ID
      return false;
    }
    
    // 5. Final check: make sure email body has substantial content
    const bodyText = emailBody.textContent || emailBody.innerText || '';
    if (bodyText.trim().length < 20) {
      return false;
    }
    
    return true;
  }

  create(emailView) {
    // Double-check we're in email view before creating
    if (!this.isEmailView()) {
      return;
    }
    
    // Check if already exists
    const existing = emailView.querySelector('.inboxpilot-email-actions');
    if (existing) return;
    
    const actionsBar = document.createElement('div');
    actionsBar.className = 'inboxpilot-email-actions';
    
    const actions = [
      { action: 'summarize-email', icon: '📝', text: 'Summarize' },
      { action: 'reply-email', icon: '✍️', text: 'Generate Reply' },
      { action: 'followup-email', icon: '⏰', text: 'Follow-up' },
      { action: 'meeting-email', icon: '📅', text: 'Meeting' },
      { action: 'explain-email', icon: '💡', text: 'Explain' }
    ];
    
    actions.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'inboxpilot-action-btn';
      btn.setAttribute('data-action', item.action);
      btn.setAttribute('type', 'button');
      const span = document.createElement('span');
      span.textContent = item.icon + ' ' + item.text;
      btn.appendChild(span);
      actionsBar.appendChild(btn);
    });

    // Try multiple selectors to find the best place to insert
    const emailHeader = emailView.querySelector('h2.hP')?.parentElement ||
                        emailView.querySelector('[data-thread-perm-id]') ||
                        emailView.querySelector('.gD')?.parentElement ||
                        emailView.querySelector('.hP')?.parentElement;
    
    if (emailHeader) {
      // Insert after the header, not inside it
      if (emailHeader.nextSibling) {
        emailHeader.parentNode.insertBefore(actionsBar, emailHeader.nextSibling);
      } else {
        emailHeader.parentNode.appendChild(actionsBar);
      }
    } else {
      // Fallback: insert at the beginning of main area
      const mainContent = emailView.querySelector('[role="main"] > div') || emailView;
      if (mainContent.firstChild) {
        mainContent.insertBefore(actionsBar, mainContent.firstChild);
      } else {
        mainContent.appendChild(actionsBar);
      }
    }

    actionsBar.querySelectorAll('.inboxpilot-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const actionBtn = e.target.closest('.inboxpilot-action-btn');
        if (actionBtn && actionBtn.dataset.action) {
          this.actionHandler(actionBtn.dataset.action);
        }
      });
    });
  }
}

