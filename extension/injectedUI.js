(function() {
  'use strict';

  const API_BASE = 'http://localhost:5000/api';

  class InboxPilotUI {
    constructor() {
      this.panel = null;
      this.composeToolbar = null;
      this.isInitialized = false;
      this.init();
    }

    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      // Wait for Gmail to load
      this.waitForGmail(() => {
        this.createSidebarPanel();
        this.injectComposeToolbar();
        this.injectEmailActions();
        this.observeGmailChanges();
      });
    }

    waitForGmail(callback) {
      const checkGmail = () => {
        if (document.querySelector('[role="main"]')) {
          callback();
        } else {
          setTimeout(checkGmail, 500);
        }
      };
      checkGmail();
    }

    createSidebarPanel() {
      // Remove existing panel
      const existing = document.getElementById('inboxpilot-panel');
      if (existing) existing.remove();

      const panel = document.createElement('div');
      panel.id = 'inboxpilot-panel';
      panel.innerHTML = `
        <div class="inboxpilot-header">
          <h3>InboxPilot AI</h3>
          <button class="inboxpilot-close">×</button>
        </div>
        <div class="inboxpilot-content">
          <div class="inboxpilot-loading" style="display: none;">Loading...</div>
          <div class="inboxpilot-summary"></div>
          <div class="inboxpilot-actions">
            <button class="inboxpilot-btn" data-action="summarize">📝 Summarize</button>
            <button class="inboxpilot-btn" data-action="reply">✍️ Generate Reply</button>
            <button class="inboxpilot-btn" data-action="followup">⏰ Follow-up</button>
            <button class="inboxpilot-btn" data-action="meeting">📅 Meeting Times</button>
            <button class="inboxpilot-btn" data-action="explain">💡 Explain Simply</button>
          </div>
          <div class="inboxpilot-results"></div>
        </div>
      `;

      document.body.appendChild(panel);

      // Attach event listeners
      panel.querySelector('.inboxpilot-close').addEventListener('click', () => {
        panel.style.display = 'none';
      });

      panel.querySelectorAll('.inboxpilot-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleAction(e.target.dataset.action);
        });
      });

      this.panel = panel;
    }

    injectComposeToolbar() {
      const observer = new MutationObserver(() => {
        const composeBox = document.querySelector('[role="dialog"]');
        if (composeBox && !composeBox.querySelector('.inboxpilot-compose-toolbar')) {
          this.createComposeToolbar(composeBox);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    createComposeToolbar(composeBox) {
      const toolbar = document.createElement('div');
      toolbar.className = 'inboxpilot-compose-toolbar';
      toolbar.innerHTML = `
        <div class="inboxpilot-toolbar-content">
          <span class="inboxpilot-label">AI Assistant:</span>
          <button class="inboxpilot-toolbar-btn" data-action="rewrite">✏️ Rewrite</button>
          <button class="inboxpilot-toolbar-btn" data-action="expand">📝 Expand</button>
          <button class="inboxpilot-toolbar-btn" data-action="shorten">✂️ Shorten</button>
          <select class="inboxpilot-tone-select">
            <option value="formal">Formal</option>
            <option value="friendly" selected>Friendly</option>
            <option value="assertive">Assertive</option>
            <option value="short">Short</option>
          </select>
          <button class="inboxpilot-toolbar-btn" data-action="change-tone">🎨 Change Tone</button>
          <button class="inboxpilot-toolbar-btn" data-action="generate">✨ Generate Email</button>
        </div>
      `;

      const composeBody = composeBox.querySelector('[contenteditable="true"]')?.parentElement;
      if (composeBody) {
        composeBody.insertBefore(toolbar, composeBody.firstChild);
      }

      toolbar.querySelectorAll('.inboxpilot-toolbar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleComposeAction(e.target.dataset.action, composeBox);
        });
      });

      this.composeToolbar = toolbar;
    }

    injectEmailActions() {
      const observer = new MutationObserver(() => {
        const emailView = document.querySelector('[role="main"]');
        if (emailView && !emailView.querySelector('.inboxpilot-email-actions')) {
          this.createEmailActions(emailView);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    createEmailActions(emailView) {
      const actionsBar = document.createElement('div');
      actionsBar.className = 'inboxpilot-email-actions';
      actionsBar.innerHTML = `
        <button class="inboxpilot-action-btn" data-action="summarize-email">📝 Summarize</button>
        <button class="inboxpilot-action-btn" data-action="reply-email">✍️ Generate Reply</button>
        <button class="inboxpilot-action-btn" data-action="followup-email">⏰ Follow-up</button>
        <button class="inboxpilot-action-btn" data-action="meeting-email">📅 Meeting</button>
        <button class="inboxpilot-action-btn" data-action="explain-email">💡 Explain</button>
      `;

      const emailHeader = emailView.querySelector('h2.hP')?.parentElement;
      if (emailHeader) {
        emailHeader.appendChild(actionsBar);
      }

      actionsBar.querySelectorAll('.inboxpilot-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleEmailAction(e.target.dataset.action);
        });
      });
    }

    async handleAction(action) {
      const emailContent = this.getCurrentEmailContent();
      if (!emailContent.body) {
        this.showError('No email content found');
        return;
      }

      this.showLoading(true);

      try {
        let result;
        switch (action) {
          case 'summarize':
            result = await this.apiCall('/ai/summarize', { emailBody: emailContent.body });
            this.showResult(result.summary || result);
            break;
          case 'reply':
            const tone = this.panel?.querySelector('.inboxpilot-tone-select')?.value || 'friendly';
            result = await this.apiCall('/ai/reply', { emailBody: emailContent.body, tone });
            this.showReplies(result.replies || result);
            break;
          case 'followup':
            result = await this.apiCall('/ai/followup', { emailBody: emailContent.body });
            this.showResult(result.followUp || result);
            break;
          case 'meeting':
            result = await this.apiCall('/calendar/suggest', { emailBody: emailContent.body });
            this.showMeetingSuggestions(result);
            break;
          case 'explain':
            result = await this.apiCall('/ai/rewrite', {
              text: emailContent.body,
              instruction: 'Explain this email in simple, easy-to-understand words'
            });
            this.showResult(result.rewritten || result);
            break;
        }
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.showLoading(false);
      }
    }

    async handleComposeAction(action, composeBox) {
      const composeBody = composeBox.querySelector('[contenteditable="true"]');
      const currentText = composeBody?.innerText || '';

      if (!currentText && action !== 'generate') {
        this.showError('Please write something first');
        return;
      }

      this.showLoading(true);

      try {
        let result;
        switch (action) {
          case 'rewrite':
            result = await this.apiCall('/ai/rewrite', {
              text: currentText,
              instruction: 'Rewrite this text to be clearer and more professional'
            });
            this.insertIntoCompose(composeBody, result.rewritten || result);
            break;
          case 'expand':
            result = await this.apiCall('/ai/rewrite', {
              text: currentText,
              instruction: 'Expand this text with more details and context'
            });
            this.insertIntoCompose(composeBody, result.rewritten || result);
            break;
          case 'shorten':
            result = await this.apiCall('/ai/rewrite', {
              text: currentText,
              instruction: 'Make this text shorter and more concise'
            });
            this.insertIntoCompose(composeBody, result.rewritten || result);
            break;
          case 'change-tone':
            const tone = composeBox.querySelector('.inboxpilot-tone-select')?.value || 'friendly';
            result = await this.apiCall('/ai/rewrite', {
              text: currentText,
              instruction: `Rewrite this in a ${tone} tone`
            });
            this.insertIntoCompose(composeBody, result.rewritten || result);
            break;
          case 'generate':
            const subject = composeBox.querySelector('input[name="subjectbox"]')?.value || '';
            result = await this.apiCall('/ai/rewrite', {
              text: `Subject: ${subject}\n\nGenerate a professional email about this topic`,
              instruction: 'Generate a complete professional email'
            });
            this.insertIntoCompose(composeBody, result.rewritten || result);
            break;
        }
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.showLoading(false);
      }
    }

    async handleEmailAction(action) {
      const emailContent = this.getCurrentEmailContent();
      await this.handleAction(action.replace('-email', ''));
    }

    getCurrentEmailContent() {
      const emailBody = document.querySelector('.a3s') || document.querySelector('[role="main"]');
      const subject = document.querySelector('h2.hP')?.textContent || '';
      const from = document.querySelector('.gD')?.textContent || '';

      return {
        subject,
        from,
        body: emailBody?.innerText || emailBody?.textContent || '',
      };
    }

    async apiCall(endpoint, data) {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      return response.json();
    }

    async getAuthToken() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['authToken'], (result) => {
          resolve(result.authToken);
        });
      });
    }

    showLoading(show) {
      if (this.panel) {
        const loading = this.panel.querySelector('.inboxpilot-loading');
        if (loading) loading.style.display = show ? 'block' : 'none';
      }
    }

    showResult(text) {
      if (this.panel) {
        const results = this.panel.querySelector('.inboxpilot-results');
        if (results) {
          results.innerHTML = `<div class="inboxpilot-result">${text}</div>`;
        }
      }
    }

    showReplies(replies) {
      if (this.panel) {
        const results = this.panel.querySelector('.inboxpilot-results');
        if (results) {
          const html = Array.isArray(replies)
            ? replies.map((reply, i) => `<div class="inboxpilot-reply" data-index="${i}">${reply}</div>`).join('')
            : `<div class="inboxpilot-reply">${replies}</div>`;
          results.innerHTML = html;

          results.querySelectorAll('.inboxpilot-reply').forEach(reply => {
            reply.addEventListener('click', () => {
              this.insertReplyIntoGmail(reply.textContent);
            });
          });
        }
      }
    }

    showMeetingSuggestions(data) {
      if (this.panel) {
        const results = this.panel.querySelector('.inboxpilot-results');
        if (results) {
          results.innerHTML = `<div class="inboxpilot-meeting">${JSON.stringify(data, null, 2)}</div>`;
        }
      }
    }

    showError(message) {
      if (this.panel) {
        const results = this.panel.querySelector('.inboxpilot-results');
        if (results) {
          results.innerHTML = `<div class="inboxpilot-error">Error: ${message}</div>`;
        }
      }
    }

    insertIntoCompose(composeBody, text) {
      if (composeBody) {
        composeBody.innerText = text;
        composeBody.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    insertReplyIntoGmail(text) {
      const replyButton = document.querySelector('[data-tooltip="Reply"]') || 
                         document.querySelector('[aria-label*="Reply"]');
      if (replyButton) {
        replyButton.click();
        setTimeout(() => {
          const replyBody = document.querySelector('[contenteditable="true"][g_editable="true"]');
          if (replyBody) {
            replyBody.innerText = text;
            replyBody.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 500);
      }
    }

    observeGmailChanges() {
      const observer = new MutationObserver(() => {
        if (this.panel && this.panel.style.display !== 'none') {
          this.panel.style.display = 'block';
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new InboxPilotUI());
  } else {
    new InboxPilotUI();
  }
})();

