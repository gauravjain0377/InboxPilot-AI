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

      const processRows = () => {
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
      };

      // Process any rows that already exist when the extension loads
      processRows();

      this.observer = new MutationObserver(() => {
        processRows();
      });

      this.observer.observe(mainArea, { childList: true, subtree: true });
    } catch (error) {
      console.error('InboxPilot: Error setting up email list features:', error);
    }
  }

  enhanceEmailRow(row) {
    try {
      if (!row || row.querySelector('.inboxpilot-email-controls') || row.querySelector('.inboxpilot-email-labels')) return;
      
      // Find the subject span and the best container to attach labels to
      const subjectSpan = row.querySelector('span[class*="bog"]');
      if (!subjectSpan) return;

      // In most Gmail layouts, subject span is inside an <a> inside a <td>; we want to attach labels under that cell
      let subjectCell = subjectSpan.closest('td');
      if (!subjectCell) {
        subjectCell = subjectSpan.parentElement || row;
      }

      // Add semantic tags (Finance, Marketing, High Priority, etc.) next to subject
      try {
        const subjectText = row.querySelector('span[class*="bog"]')?.textContent || '';
        const snippetText = row.querySelector('span[class*="y2"]')?.textContent || '';
        const fromText = row.querySelector('span[email]')?.getAttribute('email') ||
                         row.querySelector('span[email]')?.textContent ||
                         row.querySelector('span[class*="yP"]')?.textContent ||
                         '';
        const emailExtractor = (window.inboxPilotComponents && window.inboxPilotComponents.emailExtractor)
          ? window.inboxPilotComponents.emailExtractor
          : (typeof EmailExtractor !== 'undefined' ? new EmailExtractor() : null);

        if (emailExtractor && (subjectText || snippetText || fromText)) {
          const detectedLabels = emailExtractor.detectLabels(subjectText, snippetText, fromText) || [];
          if (detectedLabels.length > 0) {
            const labelsContainer = document.createElement('div');
            labelsContainer.className = 'inboxpilot-email-labels';
            labelsContainer.style.marginTop = '2px';
            labelsContainer.style.display = 'flex';
            labelsContainer.style.flexWrap = 'wrap';
            labelsContainer.style.gap = '4px';

            const seenClasses = new Set();

            const threadId = row.getAttribute('data-thread-id') || row.getAttribute('data-legacy-thread-id') || '';
            const apiService = window.inboxPilotComponents && window.inboxPilotComponents.apiService;

            detectedLabels.forEach(label => {
              if (!label || !label.class || seenClasses.has(label.class)) return;
              seenClasses.add(label.class);

              const chip = document.createElement('span');
              chip.className = `inboxpilot-email-label inboxpilot-label-${label.class}`;
              chip.textContent = label.text;
              labelsContainer.appendChild(chip);

              // Apply visual priority highlight on the row
              if (label.class === 'high-priority') {
                row.classList.add('priority-high');
              }

              // Persist priority/category to backend for analytics (best effort)
              if (apiService && threadId) {
                const payload = { emailId: threadId, label: label.text };
                if (label.class === 'high-priority') {
                  payload.priority = 'high';
                }
                if (label.class === 'medium-priority') {
                  payload.priority = 'medium';
                }
                if (label.class === 'low-priority') {
                  payload.priority = 'low';
                }
                if (label.class === 'finance' || label.class === 'scheduling' || label.class === 'marketing' || label.class === 'social') {
                  if (label.class === 'finance') payload.category = 'Finance';
                  if (label.class === 'scheduling') payload.category = 'Scheduling';
                  if (label.class === 'marketing') payload.category = 'Marketing';
                  if (label.class === 'social') payload.category = 'Social';
                }

                try {
                  apiService.call('/gmail/apply-label', payload).catch(() => {});
                } catch (e) {
                  // Ignore errors in auto-tag sync
                }
              }
            });

            // Also reflect any manual priority selections (high/medium/low) as chips
            if (row.classList.contains('priority-high') && !seenClasses.has('high-priority')) {
              const chip = document.createElement('span');
              chip.className = 'inboxpilot-email-label inboxpilot-label-high-priority';
              chip.textContent = 'High Priority';
              labelsContainer.appendChild(chip);
            } else if (row.classList.contains('priority-medium') && !seenClasses.has('medium-priority')) {
              const chip = document.createElement('span');
              chip.className = 'inboxpilot-email-label inboxpilot-label-medium-priority';
              chip.textContent = 'Medium Priority';
              labelsContainer.appendChild(chip);
            } else if (row.classList.contains('priority-low') && !seenClasses.has('low-priority')) {
              const chip = document.createElement('span');
              chip.className = 'inboxpilot-email-label inboxpilot-label-low-priority';
              chip.textContent = 'Low Priority';
              labelsContainer.appendChild(chip);
            }

            subjectCell.appendChild(labelsContainer);
          }
        }
      } catch (labelError) {
        console.error('InboxPilot: Error applying auto labels to row:', labelError);
      }

      const controls = document.createElement('div');
      controls.className = 'inboxpilot-email-controls';
      controls.style.display = 'flex';
      controls.style.gap = '4px';
      controls.style.alignItems = 'center';
      
      const quickReplyBtn = document.createElement('button');
      quickReplyBtn.className = 'inboxpilot-quick-reply';
      quickReplyBtn.setAttribute('data-action', 'quick-reply');
      quickReplyBtn.setAttribute('title', 'AI Reply');
      quickReplyBtn.setAttribute('type', 'button');
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
        btn.setAttribute('type', 'button');
        const span = document.createElement('span');
        span.textContent = p.icon;
        btn.appendChild(span);
        controls.appendChild(btn);
      });
      
      controls.insertBefore(quickReplyBtn, controls.firstChild);

      // Try to find the best cell to insert controls
      const actionsCell = row.querySelector('td:last-child') ||
                         row.querySelector('td[style*="text-align"]') ||
                         row.querySelector('td:has(button)') ||
                         row.lastElementChild;
      
      if (actionsCell && !actionsCell.querySelector('.inboxpilot-email-controls')) {
        // Create a wrapper if needed
        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '4px';
        wrapper.appendChild(controls);
        actionsCell.appendChild(wrapper);
      }

      row.addEventListener('click', (e) => {
        if (!e.target.closest('.inboxpilot-email-controls')) {
          if (this.actionHandlers.onRowClick) {
            setTimeout(() => this.actionHandlers.onRowClick(row), 500);
          }
        }
      });

      quickReplyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.actionHandlers.onQuickReply) {
          this.actionHandlers.onQuickReply(row);
        }
      });

      controls.querySelectorAll('.inboxpilot-priority').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
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

