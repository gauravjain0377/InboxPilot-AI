/**
 * Email Actions Component - Creates action buttons in email view
 */
class EmailActions {
  constructor(actionHandler) {
    this.actionHandler = actionHandler;
    this.observer = null;
  }

  inject() {
    this.observer = new MutationObserver(() => {
      const emailView = document.querySelector('[role="main"]');
      if (emailView && !emailView.querySelector('.inboxpilot-email-actions')) {
        this.create(emailView);
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  create(emailView) {
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
      const span = document.createElement('span');
      span.textContent = item.icon + ' ' + item.text;
      btn.appendChild(span);
      actionsBar.appendChild(btn);
    });

    const emailHeader = emailView.querySelector('h2.hP')?.parentElement;
    
    if (emailHeader) {
      emailHeader.appendChild(actionsBar);
    }

    actionsBar.querySelectorAll('.inboxpilot-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.inboxpilot-action-btn');
        if (actionBtn && actionBtn.dataset.action) {
          this.actionHandler(actionBtn.dataset.action);
        }
      });
    });
  }
}

