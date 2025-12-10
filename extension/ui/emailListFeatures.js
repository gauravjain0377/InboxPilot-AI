/**
 * Email List Features Component - Enhances email rows with quick actions
 */
class EmailListFeatures {
  constructor(actionHandlers) {
    this.actionHandlers = actionHandlers;
    this.observer = null;
  }

  inject() {
    try {
      const mainArea = document.querySelector('[role="main"]');
      if (!mainArea) {
        setTimeout(() => this.inject(), 1000);
        return;
      }

      this.observer = new MutationObserver(() => {
        try {
          const emailRows = document.querySelectorAll('tr[role="row"]:not([data-inboxpilot-processed])');
          emailRows.forEach(row => {
            try {
              row.setAttribute('data-inboxpilot-processed', 'true');
              this.enhanceEmailRow(row);
            } catch (error) {
              console.error('InboxPilot: Error processing email row:', error);
            }
          });
        } catch (error) {
          console.error('InboxPilot: Error in mutation observer:', error);
        }
      });

      this.observer.observe(mainArea, { childList: true, subtree: true });
    } catch (error) {
      console.error('InboxPilot: Error setting up email list features:', error);
    }
  }

  enhanceEmailRow(row) {
    try {
      if (!row || row.querySelector('.inboxpilot-email-controls')) return;
      
      const subjectCell = row.querySelector('td[class*="bog"]');
      if (!subjectCell) return;

      const controls = document.createElement('div');
      controls.className = 'inboxpilot-email-controls';
      
      const quickReplyBtn = document.createElement('button');
      quickReplyBtn.className = 'inboxpilot-quick-reply';
      quickReplyBtn.setAttribute('data-action', 'quick-reply');
      quickReplyBtn.setAttribute('title', 'AI Reply');
      const quickReplySpan = document.createElement('span');
      quickReplySpan.textContent = '✍️';
      quickReplyBtn.appendChild(quickReplySpan);
      
      const priorities = [
        { priority: 'high', icon: '🔴', title: 'High Priority' },
        { priority: 'medium', icon: '🟡', title: 'Medium Priority' },
        { priority: 'low', icon: '🟢', title: 'Low Priority' }
      ];
      
      priorities.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'inboxpilot-priority';
        btn.setAttribute('data-priority', p.priority);
        btn.setAttribute('title', p.title);
        const span = document.createElement('span');
        span.textContent = p.icon;
        btn.appendChild(span);
        controls.appendChild(btn);
      });
      
      controls.insertBefore(quickReplyBtn, controls.firstChild);

      const actionsCell = row.querySelector('td:last-child');
      if (actionsCell && !actionsCell.querySelector('.inboxpilot-email-controls')) {
        actionsCell.appendChild(controls);
      }

      row.addEventListener('click', (e) => {
        if (!e.target.closest('.inboxpilot-email-controls')) {
          if (this.actionHandlers.onRowClick) {
            setTimeout(() => this.actionHandlers.onRowClick(row), 500);
          }
        }
      });

      quickReplyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.actionHandlers.onQuickReply) {
          this.actionHandlers.onQuickReply(row);
        }
      });

      controls.querySelectorAll('.inboxpilot-priority').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (btn.dataset.priority && this.actionHandlers.onSetPriority) {
            this.actionHandlers.onSetPriority(row, btn.dataset.priority);
          }
        });
      });
    } catch (error) {
      console.error('InboxPilot: Error enhancing email row:', error);
    }
  }
}

