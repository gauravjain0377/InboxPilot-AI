(function() {
  'use strict';

  const API_BASE = 'http://localhost:5000/api';

  class InboxPilotUI {
    constructor() {
      this.panel = null;
      this.composeToolbar = null;
      this.isInitialized = false;
      this.currentEmail = null;
      this.init();
    }

    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      this.waitForGmail(() => {
        this.createSidebarPanel();
        this.injectComposeToolbar();
        this.injectEmailActions();
        this.injectEmailListFeatures();
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
      const existing = document.getElementById('inboxpilot-panel');
      if (existing) existing.remove();

      const panel = document.createElement('div');
      panel.id = 'inboxpilot-panel';
      panel.innerHTML = `
        <div class="inboxpilot-header">
          <div class="inboxpilot-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <h3>InboxPilot AI</h3>
          </div>
          <button class="inboxpilot-close" title="Close">×</button>
        </div>
        <div class="inboxpilot-content">
          <div class="inboxpilot-loading" style="display: none;">
            <div class="spinner"></div>
            <span>Processing...</span>
          </div>
          <div class="inboxpilot-email-info" id="inboxpilot-email-info"></div>
          <div class="inboxpilot-actions">
            <button class="inboxpilot-btn" data-action="summarize">
              <span class="icon">📝</span>
              <span>Summarize</span>
            </button>
            <button class="inboxpilot-btn" data-action="reply">
              <span class="icon">✍️</span>
              <span>Generate Reply</span>
            </button>
            <button class="inboxpilot-btn" data-action="followup">
              <span class="icon">⏰</span>
              <span>Follow-up</span>
            </button>
            <button class="inboxpilot-btn" data-action="meeting">
              <span class="icon">📅</span>
              <span>Meeting Times</span>
            </button>
            <button class="inboxpilot-btn" data-action="explain">
              <span class="icon">💡</span>
              <span>Explain Simply</span>
            </button>
            <button class="inboxpilot-btn" data-action="priority">
              <span class="icon">⭐</span>
              <span>Set Priority</span>
            </button>
          </div>
          <div class="inboxpilot-results" id="inboxpilot-results"></div>
        </div>
      `;

      document.body.appendChild(panel);

      panel.querySelector('.inboxpilot-close').addEventListener('click', () => {
        panel.classList.toggle('collapsed');
      });

      panel.querySelectorAll('.inboxpilot-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleAction(e.target.closest('.inboxpilot-btn').dataset.action);
        });
      });

      this.panel = panel;
    }

    injectEmailListFeatures() {
      const observer = new MutationObserver(() => {
        const emailRows = document.querySelectorAll('tr[role="row"]:not([data-inboxpilot-processed])');
        emailRows.forEach(row => {
          row.setAttribute('data-inboxpilot-processed', 'true');
          this.enhanceEmailRow(row);
        });
      });

      observer.observe(document.querySelector('[role="main"]'), { childList: true, subtree: true });
    }

    enhanceEmailRow(row) {
      const subjectCell = row.querySelector('td[class*="bog"]');
      if (!subjectCell) return;

      // Extract email info
      const subject = subjectCell.textContent.trim();
      const sender = row.querySelector('span[email]')?.getAttribute('email') || 
                     row.querySelector('span[class*="yW"]')?.textContent || '';
      
      // Create InboxPilot controls
      const controls = document.createElement('div');
      controls.className = 'inboxpilot-email-controls';
      controls.innerHTML = `
        <button class="inboxpilot-quick-reply" data-action="quick-reply" title="AI Reply">
          <span>✍️</span>
        </button>
        <button class="inboxpilot-priority" data-priority="high" title="High Priority">
          <span>🔴</span>
        </button>
        <button class="inboxpilot-priority" data-priority="medium" title="Medium Priority">
          <span>🟡</span>
        </button>
        <button class="inboxpilot-priority" data-priority="low" title="Low Priority">
          <span>🟢</span>
        </button>
      `;

      // Add controls to row
      const actionsCell = row.querySelector('td:last-child');
      if (actionsCell && !actionsCell.querySelector('.inboxpilot-email-controls')) {
        actionsCell.appendChild(controls);
      }

      // Add click handler to row
      row.addEventListener('click', (e) => {
        if (!e.target.closest('.inboxpilot-email-controls')) {
          setTimeout(() => this.updateSidebarWithEmail(row), 500);
        }
      });

      // Quick reply handler
      controls.querySelector('.inboxpilot-quick-reply')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.quickReply(row);
      });

      // Priority handlers
      controls.querySelectorAll('.inboxpilot-priority').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setPriority(row, btn.dataset.priority);
        });
      });
    }

    updateSidebarWithEmail(row) {
      const subject = row.querySelector('td[class*="bog"]')?.textContent || '';
      const sender = row.querySelector('span[email]')?.getAttribute('email') || '';
      const snippet = row.querySelector('span[class*="bog"]')?.textContent || '';

      const emailInfo = this.panel.querySelector('#inboxpilot-email-info');
      if (emailInfo) {
        emailInfo.innerHTML = `
          <div class="email-preview">
            <div class="email-from"><strong>From:</strong> ${sender}</div>
            <div class="email-subject"><strong>Subject:</strong> ${subject}</div>
            <div class="email-snippet">${snippet.substring(0, 100)}...</div>
          </div>
        `;
      }

      this.currentEmail = { subject, sender, snippet };
    }

    async quickReply(row) {
      const emailContent = this.extractEmailContent(row);
      if (!emailContent) return;

      this.showLoading(true);
      try {
        const result = await this.apiCall('/ai/reply', { 
          emailBody: emailContent, 
          tone: 'friendly' 
        });
        const replies = result.replies || [result];
        this.insertReplyIntoGmail(replies[0]);
      } catch (error) {
        this.showError('Failed to generate reply');
      } finally {
        this.showLoading(false);
      }
    }

    async setPriority(row, priority) {
      const emailId = row.getAttribute('data-thread-id') || '';
      try {
        await this.apiCall('/gmail/apply-label', {
          emailId,
          label: `Priority-${priority}`,
          priority
        });
        row.classList.add(`priority-${priority}`);
        this.showSuccess(`Priority set to ${priority}`);
      } catch (error) {
        this.showError('Failed to set priority');
      }
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
          <span class="inboxpilot-label">✨ AI Assistant</span>
          <div class="inboxpilot-toolbar-buttons">
            <button class="inboxpilot-toolbar-btn" data-action="rewrite" title="Rewrite">
              <span>✏️</span> Rewrite
            </button>
            <button class="inboxpilot-toolbar-btn" data-action="expand" title="Expand">
              <span>📝</span> Expand
            </button>
            <button class="inboxpilot-toolbar-btn" data-action="shorten" title="Shorten">
              <span>✂️</span> Shorten
            </button>
            <select class="inboxpilot-tone-select">
              <option value="formal">Formal</option>
              <option value="friendly" selected>Friendly</option>
              <option value="assertive">Assertive</option>
              <option value="short">Short</option>
            </select>
            <button class="inboxpilot-toolbar-btn" data-action="change-tone" title="Change Tone">
              <span>🎨</span> Tone
            </button>
            <button class="inboxpilot-toolbar-btn primary" data-action="generate" title="Generate Email">
              <span>✨</span> Generate
            </button>
          </div>
        </div>
      `;

      const composeBody = composeBox.querySelector('[contenteditable="true"]')?.parentElement;
      if (composeBody) {
        composeBody.insertBefore(toolbar, composeBody.firstChild);
      }

      toolbar.querySelectorAll('.inboxpilot-toolbar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleComposeAction(e.target.closest('.inboxpilot-toolbar-btn').dataset.action, composeBox);
        });
      });
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
        <button class="inboxpilot-action-btn" data-action="summarize-email">
          <span>📝</span> Summarize
        </button>
        <button class="inboxpilot-action-btn" data-action="reply-email">
          <span>✍️</span> Generate Reply
        </button>
        <button class="inboxpilot-action-btn" data-action="followup-email">
          <span>⏰</span> Follow-up
        </button>
        <button class="inboxpilot-action-btn" data-action="meeting-email">
          <span>📅</span> Meeting
        </button>
        <button class="inboxpilot-action-btn" data-action="explain-email">
          <span>💡</span> Explain
        </button>
      `;

      const emailHeader = emailView.querySelector('h2.hP')?.parentElement;
      if (emailHeader) {
        emailHeader.appendChild(actionsBar);
      }

      actionsBar.querySelectorAll('.inboxpilot-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleEmailAction(e.target.closest('.inboxpilot-action-btn').dataset.action);
        });
      });
    }

    async handleAction(action) {
      const emailContent = this.getCurrentEmailContent();
      if (!emailContent.body) {
        this.showError('No email content found. Please open an email first.');
        return;
      }

      this.showLoading(true);

      try {
        let result;
        switch (action) {
          case 'summarize':
            result = await this.apiCall('/ai/summarize', { emailBody: emailContent.body });
            this.showResult(result.summary || result, 'Summary');
            break;
          case 'reply':
            const tone = this.panel?.querySelector('.inboxpilot-tone-select')?.value || 'friendly';
            result = await this.apiCall('/ai/reply', { emailBody: emailContent.body, tone });
            this.showReplies(result.replies || result);
            break;
          case 'followup':
            result = await this.apiCall('/ai/followup', { emailBody: emailContent.body });
            this.showResult(result.followUp || result, 'Follow-up Draft');
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
            this.showResult(result.rewritten || result, 'Simple Explanation');
            break;
          case 'priority':
            this.showPrioritySelector();
            break;
        }
      } catch (error) {
        this.showError(error.message || 'Action failed');
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

    extractEmailContent(row) {
      const snippet = row.querySelector('span[class*="bog"]')?.textContent || '';
      return snippet;
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
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'API request failed');
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
        if (loading) loading.style.display = show ? 'flex' : 'none';
      }
    }

    showResult(text, title = 'Result') {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.innerHTML = `
            <div class="inboxpilot-result-card">
              <div class="result-title">${title}</div>
              <div class="result-content">${text}</div>
              <button class="result-copy" onclick="navigator.clipboard.writeText('${text.replace(/'/g, "\\'")}')">Copy</button>
            </div>
          `;
        }
      }
    }

    showReplies(replies) {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          const html = Array.isArray(replies)
            ? replies.map((reply, i) => `
              <div class="inboxpilot-reply-card" data-index="${i}">
                <div class="reply-content">${reply}</div>
                <button class="reply-use">Use This Reply</button>
              </div>
            `).join('')
            : `<div class="inboxpilot-reply-card"><div class="reply-content">${replies}</div><button class="reply-use">Use This Reply</button></div>`;
          results.innerHTML = html;

          results.querySelectorAll('.reply-use').forEach((btn, i) => {
            btn.addEventListener('click', () => {
              const replyCard = btn.closest('.inboxpilot-reply-card');
              const replyText = replyCard.querySelector('.reply-content').textContent;
              this.insertReplyIntoGmail(replyText);
            });
          });
        }
      }
    }

    showMeetingSuggestions(data) {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.innerHTML = `<div class="inboxpilot-meeting-card">${JSON.stringify(data, null, 2)}</div>`;
        }
      }
    }

    showError(message) {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.innerHTML = `<div class="inboxpilot-error">❌ ${message}</div>`;
        }
      }
    }

    showSuccess(message) {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.innerHTML = `<div class="inboxpilot-success">✓ ${message}</div>`;
          setTimeout(() => {
            results.innerHTML = '';
          }, 3000);
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
                         document.querySelector('[aria-label*="Reply"]') ||
                         document.querySelector('[aria-label*="reply"]');
      if (replyButton) {
        replyButton.click();
        setTimeout(() => {
          const replyBody = document.querySelector('[contenteditable="true"][g_editable="true"]') ||
                           document.querySelector('[contenteditable="true"]');
          if (replyBody) {
            replyBody.innerText = text;
            replyBody.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 500);
      } else {
        this.showError('Please open the email to reply');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new InboxPilotUI());
  } else {
    new InboxPilotUI();
  }
})();
