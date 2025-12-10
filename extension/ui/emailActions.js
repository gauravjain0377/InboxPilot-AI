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
      const emailView = document.querySelector('[role="main"]');
      if (emailView && !emailView.querySelector('.inboxpilot-email-actions')) {
        this.create(emailView);
      }
    }, 1000);
    
    // Watch for email view changes
    this.observer = new MutationObserver((mutations) => {
      const emailView = document.querySelector('[role="main"]');
      if (emailView && !emailView.querySelector('.inboxpilot-email-actions')) {
        // Check if we're actually viewing an email (not just the list)
        const hasEmailContent = emailView.querySelector('h2.hP') || 
                               emailView.querySelector('.a3s') ||
                               emailView.querySelector('[data-thread-perm-id]');
        if (hasEmailContent) {
          this.create(emailView);
        }
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  create(emailView) {
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

