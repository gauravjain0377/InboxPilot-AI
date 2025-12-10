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
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds max wait
      
      const checkGmail = () => {
        attempts++;
        if (document.querySelector('[role="main"]') && document.body) {
          callback();
        } else if (attempts < maxAttempts) {
          setTimeout(checkGmail, 500);
        } else {
          console.warn('InboxPilot: Gmail not detected after timeout');
        }
      };
      checkGmail();
    }

    createSidebarPanel() {
      try {
        const existing = document.getElementById('inboxpilot-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'inboxpilot-panel';

        // Create header
        const header = document.createElement('div');
        header.className = 'inboxpilot-header';
        
        const logo = document.createElement('div');
        logo.className = 'inboxpilot-logo';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z');
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', '22,6 12,13 2,6');
        svg.appendChild(path1);
        svg.appendChild(polyline);
        logo.appendChild(svg);
        const h3 = document.createElement('h3');
        h3.textContent = 'InboxPilot AI';
        logo.appendChild(h3);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'inboxpilot-close';
        closeBtn.setAttribute('title', 'Close');
        closeBtn.textContent = '×';
        
        header.appendChild(logo);
        header.appendChild(closeBtn);

        // Create content
        const content = document.createElement('div');
        content.className = 'inboxpilot-content';
        
        const loading = document.createElement('div');
        loading.className = 'inboxpilot-loading';
        loading.style.display = 'none';
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        const loadingText = document.createElement('span');
        loadingText.textContent = 'Processing...';
        loading.appendChild(spinner);
        loading.appendChild(loadingText);
        
        const emailInfo = document.createElement('div');
        emailInfo.className = 'inboxpilot-email-info';
        emailInfo.id = 'inboxpilot-email-info';
        
        const actions = document.createElement('div');
        actions.className = 'inboxpilot-actions';
        
        const actionsList = [
          { action: 'summarize', icon: '📝', text: 'Summarize' },
          { action: 'reply', icon: '✍️', text: 'Generate Reply' },
          { action: 'followup', icon: '⏰', text: 'Follow-up' },
          { action: 'meeting', icon: '📅', text: 'Meeting' },
          { action: 'explain', icon: '💡', text: 'Explain' }
        ];
        
        actionsList.forEach(item => {
          const btn = document.createElement('button');
          btn.className = 'inboxpilot-btn';
          btn.setAttribute('data-action', item.action);
          const iconSpan = document.createElement('span');
          iconSpan.className = 'icon';
          iconSpan.textContent = item.icon;
          const textSpan = document.createElement('span');
          textSpan.textContent = item.text;
          btn.appendChild(iconSpan);
          btn.appendChild(textSpan);
          actions.appendChild(btn);
        });
        
        const results = document.createElement('div');
        results.className = 'inboxpilot-results';
        results.id = 'inboxpilot-results';
        
        content.appendChild(loading);
        content.appendChild(emailInfo);
        content.appendChild(actions);
        content.appendChild(results);
        
        panel.appendChild(header);
        panel.appendChild(content);

        if (!document.body) {
          setTimeout(() => this.createSidebarPanel(), 100);
          return;
        }

        document.body.appendChild(panel);

        // Add event listener to close button (already created above)
        closeBtn.addEventListener('click', () => {
          panel.classList.toggle('collapsed');
        });

        panel.querySelectorAll('.inboxpilot-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.inboxpilot-btn');
            if (actionBtn && actionBtn.dataset.action) {
              this.handleAction(actionBtn.dataset.action);
            }
          });
        });

        this.panel = panel;
      } catch (error) {
        console.error('InboxPilot: Error creating sidebar panel:', error);
      }
    }

    injectEmailListFeatures() {
      try {
        const mainArea = document.querySelector('[role="main"]');
        if (!mainArea) {
          setTimeout(() => this.injectEmailListFeatures(), 1000);
          return;
        }

        const observer = new MutationObserver(() => {
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

        observer.observe(mainArea, { childList: true, subtree: true });
      } catch (error) {
        console.error('InboxPilot: Error setting up email list features:', error);
      }
    }

    enhanceEmailRow(row) {
      try {
        if (!row || row.querySelector('.inboxpilot-email-controls')) return;
        
        const subjectCell = row.querySelector('td[class*="bog"]');
        if (!subjectCell) return;

      // Extract email info
      const subject = subjectCell.textContent.trim();
      const sender = row.querySelector('span[email]')?.getAttribute('email') || 
                     row.querySelector('span[class*="yW"]')?.textContent || '';
      
      // Create InboxPilot controls
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
          if (btn.dataset.priority) {
            this.setPriority(row, btn.dataset.priority);
          }
        });
      });
      } catch (error) {
        console.error('InboxPilot: Error enhancing email row:', error);
      }
    }

    updateSidebarWithEmail(row) {
      const subject = row.querySelector('td[class*="bog"]')?.textContent || '';
      const sender = row.querySelector('span[email]')?.getAttribute('email') || '';
      const snippet = row.querySelector('span[class*="bog"]')?.textContent || '';
      
      // Detect labels based on content
      const labels = this.detectLabels(subject, snippet);

      const emailInfo = this.panel.querySelector('#inboxpilot-email-info');
      if (emailInfo) {
        emailInfo.textContent = ''; // Clear existing content
        
        const preview = document.createElement('div');
        preview.className = 'email-preview';
        
        // Add labels
        if (labels.length > 0) {
          const labelsDiv = document.createElement('div');
          labelsDiv.style.marginBottom = '12px';
          labelsDiv.style.display = 'flex';
          labelsDiv.style.flexWrap = 'wrap';
          labelsDiv.style.gap = '8px';
          
          labels.forEach(label => {
            const labelSpan = document.createElement('span');
            labelSpan.className = `inboxpilot-email-label inboxpilot-label-${label.class}`;
            labelSpan.textContent = label.text;
            labelsDiv.appendChild(labelSpan);
          });
          
          preview.appendChild(labelsDiv);
        }
        
        const fromDiv = document.createElement('div');
        fromDiv.className = 'email-from';
        fromDiv.style.fontSize = '13px';
        fromDiv.style.color = '#202124';
        fromDiv.style.marginBottom = '4px';
        fromDiv.appendChild(document.createTextNode('From: '));
        const fromStrong = document.createElement('strong');
        fromStrong.textContent = sender;
        fromDiv.appendChild(fromStrong);
        
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'email-subject';
        subjectDiv.style.fontSize = '15px';
        subjectDiv.style.fontWeight = '600';
        subjectDiv.style.color = '#202124';
        subjectDiv.style.marginBottom = '8px';
        subjectDiv.textContent = subject;
        
        const snippetDiv = document.createElement('div');
        snippetDiv.className = 'email-snippet';
        snippetDiv.style.fontSize = '13px';
        snippetDiv.style.color = '#5f6368';
        snippetDiv.textContent = snippet.substring(0, 100) + (snippet.length > 100 ? '...' : '');
        
        preview.appendChild(fromDiv);
        preview.appendChild(subjectDiv);
        preview.appendChild(snippetDiv);
        emailInfo.appendChild(preview);
      }

      this.currentEmail = { subject, sender, snippet };
    }
    
    detectLabels(subject, snippet) {
      const labels = [];
      const text = (subject + ' ' + snippet).toLowerCase();
      
      // Finance labels
      if (text.match(/\b(invoice|payment|bill|receipt|finance|financial|accounting|billing|payment due|amount|price|cost|fee)\b/)) {
        labels.push({ text: 'Finance', class: 'finance' });
      }
      
      // Priority labels
      if (text.match(/\b(urgent|asap|immediately|important|priority|high priority|critical)\b/)) {
        labels.push({ text: 'High Priority', class: 'high-priority' });
      } else if (text.match(/\b(meeting|schedule|calendar|appointment|call|conference)\b/)) {
        labels.push({ text: 'Scheduling', class: 'scheduling' });
      }
      
      return labels;
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
      
      const content = document.createElement('div');
      content.className = 'inboxpilot-toolbar-content';
      
      const label = document.createElement('span');
      label.className = 'inboxpilot-label';
      label.textContent = '✨ AI Assistant';
      
      const buttons = document.createElement('div');
      buttons.className = 'inboxpilot-toolbar-buttons';
      
      const toolbarActions = [
        { action: 'rewrite', icon: '✏️', text: 'Rewrite', title: 'Rewrite' },
        { action: 'expand', icon: '📝', text: 'Expand', title: 'Expand' },
        { action: 'shorten', icon: '✂️', text: 'Shorten', title: 'Shorten' },
        { action: 'change-tone', icon: '🎨', text: 'Tone', title: 'Change Tone' },
        { action: 'generate', icon: '✨', text: 'Generate', title: 'Generate Email', primary: true }
      ];
      
      // Add tone select first
      const select = document.createElement('select');
      select.className = 'inboxpilot-tone-select';
      ['formal', 'friendly', 'assertive', 'short'].forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val.charAt(0).toUpperCase() + val.slice(1);
        if (val === 'friendly') option.selected = true;
        select.appendChild(option);
      });
      buttons.appendChild(select);
      
      // Add buttons
      toolbarActions.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'inboxpilot-toolbar-btn' + (item.primary ? ' primary' : '');
        btn.setAttribute('data-action', item.action);
        btn.setAttribute('title', item.title);
        const span = document.createElement('span');
        span.textContent = item.icon + ' ' + item.text;
        btn.appendChild(span);
        buttons.appendChild(btn);
      });
      
      content.appendChild(label);
      content.appendChild(buttons);
      toolbar.appendChild(content);

      // Try multiple selectors to find compose body
      const composeBody = composeBox.querySelector('[contenteditable="true"]')?.parentElement ||
                          composeBox.querySelector('.Am') ||
                          composeBox.querySelector('[role="textbox"]')?.parentElement ||
                          composeBox.querySelector('.aO');
      
      if (composeBody) {
        // Check if toolbar already exists
        if (!composeBody.querySelector('.inboxpilot-compose-toolbar')) {
          composeBody.insertBefore(toolbar, composeBody.firstChild);
        }
      } else {
        // Fallback: insert at the top of compose box
        composeBox.insertBefore(toolbar, composeBox.firstChild);
      }

      toolbar.querySelectorAll('.inboxpilot-toolbar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const actionBtn = e.target.closest('.inboxpilot-toolbar-btn');
          if (actionBtn && actionBtn.dataset.action) {
            this.handleComposeAction(actionBtn.dataset.action, composeBox);
          }
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
      
      actionsBar.querySelectorAll('.inboxpilot-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const actionBtn = e.target.closest('.inboxpilot-action-btn');
          if (actionBtn && actionBtn.dataset.action) {
            this.handleEmailAction(actionBtn.dataset.action);
          }
        });
      });
      if (emailHeader) {
        emailHeader.appendChild(actionsBar);
      }

      actionsBar.querySelectorAll('.inboxpilot-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.inboxpilot-action-btn');
          if (actionBtn && actionBtn.dataset.action) {
            this.handleEmailAction(actionBtn.dataset.action);
          }
        });
      });
    }

    async handleAction(action) {
      const emailContent = this.getCurrentEmailContent();
      if (!emailContent.body || emailContent.body.trim().length === 0) {
        this.showError('No email content found. Please open an email first.');
        return;
      }

      this.showLoading(true);
      
      // Clear previous results
      const results = this.panel?.querySelector('#inboxpilot-results');
      if (results) {
        results.textContent = '';
      }

      try {
        let result;
        switch (action) {
          case 'summarize':
            result = await this.apiCall('/ai/summarize', { emailBody: emailContent.body });
            this.showResult(result.summary || result.text || result, 'AI Summary');
            break;
          case 'reply':
            // Show tone selector for reply
            this.showToneSelector((selectedTone) => {
              this.handleReplyWithTone(emailContent.body, selectedTone);
            });
            break;
          case 'followup':
            result = await this.apiCall('/ai/followup', { emailBody: emailContent.body });
            this.showResult(result.followUp || result.text || result, 'Follow-up Draft');
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
            this.showResult(result.rewritten || result.text || result, 'Simple Explanation');
            break;
        }
      } catch (error) {
        console.error('InboxPilot: Action error:', error);
        const errorMsg = error.message || 'Action failed. Check if backend is running at http://localhost:5000';
        this.showError(errorMsg);
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

    showToneSelector(callback) {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.textContent = '';
          
          const selectorDiv = document.createElement('div');
          selectorDiv.className = 'inboxpilot-tone-selector';
          
          const title = document.createElement('div');
          title.className = 'inboxpilot-tone-title';
          title.textContent = 'Select Reply Tone:';
          selectorDiv.appendChild(title);
          
          const tones = [
            { value: 'friendly', label: 'Friendly', icon: '😊' },
            { value: 'formal', label: 'Professional', icon: '💼' },
            { value: 'assertive', label: 'Assertive', icon: '💪' },
            { value: 'short', label: 'Brief', icon: '✂️' }
          ];
          
          const buttonsDiv = document.createElement('div');
          buttonsDiv.className = 'inboxpilot-tone-buttons';
          
          tones.forEach(tone => {
            const btn = document.createElement('button');
            btn.className = 'inboxpilot-tone-btn';
            btn.setAttribute('data-tone', tone.value);
            
            // Use textContent and createElement instead of innerHTML to avoid TrustedHTML error
            const iconSpan = document.createElement('span');
            iconSpan.textContent = tone.icon;
            const labelSpan = document.createElement('span');
            labelSpan.textContent = ' ' + tone.label;
            btn.appendChild(iconSpan);
            btn.appendChild(labelSpan);
            
            btn.addEventListener('click', () => {
              callback(tone.value);
              results.textContent = '';
            });
            buttonsDiv.appendChild(btn);
          });
          
          selectorDiv.appendChild(buttonsDiv);
          results.appendChild(selectorDiv);
        }
      }
    }

    async handleReplyWithTone(emailBody, tone) {
      this.showLoading(true);
      try {
        const result = await this.apiCall('/ai/reply', { emailBody, tone });
        const toneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);
        const replies = result.replies || (result.reply ? [result.reply] : [result.text || result]);
        this.showReplies(replies, toneLabel);
      } catch (error) {
        this.showError('Failed to generate reply: ' + error.message);
      } finally {
        this.showLoading(false);
      }
    }

    getCurrentEmailContent() {
      // Try multiple selectors to find email content
      let emailBody = document.querySelector('.a3s') || 
                      document.querySelector('.ii.gt') ||
                      document.querySelector('[role="main"] .ii') ||
                      document.querySelector('[role="main"] .a3s') ||
                      document.querySelector('[role="main"]');
      
      // If still not found, try to get from email thread
      if (!emailBody || !emailBody.textContent?.trim()) {
        const emailThread = document.querySelector('[role="main"]');
        if (emailThread) {
          // Get all text content from the main email area
          const allText = emailThread.innerText || emailThread.textContent || '';
          emailBody = { innerText: allText, textContent: allText };
        }
      }
      
      const subject = document.querySelector('h2.hP')?.textContent || 
                     document.querySelector('[data-thread-perm-id] h2')?.textContent ||
                     '';
      const from = document.querySelector('.gD')?.textContent || 
                  document.querySelector('[email]')?.getAttribute('email') ||
                  '';

      const body = emailBody?.innerText || emailBody?.textContent || '';
      
      // If body is empty, try to get from visible text
      if (!body.trim()) {
        const mainArea = document.querySelector('[role="main"]');
        if (mainArea) {
          const visibleText = mainArea.innerText || mainArea.textContent || '';
          if (visibleText.length > 50) {
            return {
              subject,
              from,
              body: visibleText,
            };
          }
        }
      }

      return {
        subject,
        from,
        body: body.trim(),
      };
    }

    extractEmailContent(row) {
      const snippet = row.querySelector('span[class*="bog"]')?.textContent || '';
      return snippet;
    }

    async apiCall(endpoint, data) {
      try {
        // Token is optional now - backend supports requests without token when emailBody is provided
        const token = await this.getAuthToken();
        
        // Check if backend is reachable
        const url = `${API_BASE}${endpoint}`;
        
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Only add Authorization header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }).catch((fetchError) => {
          // Network error - backend might not be running
          console.error('InboxPilot: Fetch error:', fetchError);
          throw new Error(`Cannot connect to backend. Make sure the server is running at ${API_BASE}`);
        });

        if (!response.ok) {
          let errorMessage = 'Request failed';
          try {
            const error = await response.json();
            errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        return await response.json().catch(() => {
          throw new Error('Invalid response from server');
        });
      } catch (error) {
        console.error('InboxPilot: API call error:', error);
        throw error;
      }
    }

    async getAuthToken() {
      return new Promise((resolve) => {
        try {
          // Try to get token from localStorage first (set by content script)
          const token = localStorage.getItem('inboxpilot_authToken');
          if (token) {
            resolve(token);
            return;
          }
          
          // Fallback: request from content script via message
          window.postMessage({ type: 'INBOXPILOT_GET_TOKEN' }, '*');
          
          const listener = (event) => {
            if (event.data.type === 'INBOXPILOT_TOKEN_RESPONSE') {
              window.removeEventListener('message', listener);
              resolve(event.data.token || null);
            }
          };
          window.addEventListener('message', listener);
          
          // Timeout after 500ms (faster timeout)
          setTimeout(() => {
            window.removeEventListener('message', listener);
            resolve(null); // Return null - token is optional now
          }, 500);
        } catch (error) {
          console.error('InboxPilot: Error getting auth token:', error);
          resolve(null); // Return null - token is optional now
        }
      });
    }

    showLoading(show) {
      if (this.panel) {
        const loading = this.panel.querySelector('.inboxpilot-loading');
        if (loading) loading.style.display = show ? 'flex' : 'none';
      }
    }

    showResult(text, title = 'AI Summary') {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.textContent = '';
          
          // Create AI Summary Card matching image design
          const card = document.createElement('div');
          card.className = 'inboxpilot-ai-summary-card';
          
          const header = document.createElement('div');
          header.className = 'inboxpilot-ai-summary-header';
          
          const icon = document.createElement('span');
          icon.className = 'inboxpilot-ai-summary-icon';
          icon.textContent = '✨';
          
          const titleDiv = document.createElement('div');
          titleDiv.className = 'inboxpilot-ai-summary-title';
          titleDiv.textContent = title.toUpperCase();
          
          header.appendChild(icon);
          header.appendChild(titleDiv);
          
          const contentDiv = document.createElement('div');
          contentDiv.className = 'inboxpilot-ai-summary-content';
          
          // Build content with proper DOM elements to avoid TrustedHTML error
          const highlightRegex = /(\$[\d,]+\.?\d*|[\w\s]+LLC|[\w\s]+Inc\.?|[\w\s]+Corp\.?|[\w\s]+Ltd\.?|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?)/gi;
          
          let lastIndex = 0;
          let match;
          
          while ((match = highlightRegex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              contentDiv.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }
            
            // Add highlighted match
            const strong = document.createElement('strong');
            strong.textContent = match[0];
            contentDiv.appendChild(strong);
            
            lastIndex = match.index + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < text.length) {
            contentDiv.appendChild(document.createTextNode(text.substring(lastIndex)));
          }
          
          // If no matches, just add the text
          if (contentDiv.childNodes.length === 0) {
            contentDiv.textContent = text;
          }
          
          card.appendChild(header);
          card.appendChild(contentDiv);
          results.appendChild(card);
        }
      }
    }

    showReplies(replies, tone = 'Friendly') {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.textContent = '';
          
          const repliesList = Array.isArray(replies) ? replies : [replies];
          
          repliesList.forEach((reply, i) => {
            const card = document.createElement('div');
            card.className = 'inboxpilot-reply-card';
            card.setAttribute('data-index', i.toString());
            
            // Header with title and tone
            const header = document.createElement('div');
            header.className = 'inboxpilot-reply-header';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'inboxpilot-reply-title';
            const icon = document.createElement('span');
            icon.textContent = '✨';
            const titleText = document.createTextNode('AI Draft');
            titleDiv.appendChild(icon);
            titleDiv.appendChild(document.createTextNode(' '));
            titleDiv.appendChild(titleText);
            
            const toneDiv = document.createElement('div');
            toneDiv.className = 'inboxpilot-reply-tone';
            toneDiv.textContent = `(${tone})`;
            
            header.appendChild(titleDiv);
            header.appendChild(toneDiv);
            
            // Content area with dark background
            const contentDiv = document.createElement('div');
            contentDiv.className = 'inboxpilot-reply-content';
            contentDiv.textContent = reply;
            
            // Action buttons
            const actions = document.createElement('div');
            actions.className = 'inboxpilot-reply-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'inboxpilot-reply-btn inboxpilot-reply-btn-edit';
            editBtn.textContent = 'Discard';
            editBtn.addEventListener('click', () => {
              card.remove();
            });
            
            const sendBtn = document.createElement('button');
            sendBtn.className = 'inboxpilot-reply-btn inboxpilot-reply-btn-send';
            const sendIcon = document.createElement('span');
            sendIcon.textContent = '✈️';
            sendBtn.appendChild(sendIcon);
            sendBtn.appendChild(document.createTextNode(' Send Reply'));
            sendBtn.addEventListener('click', () => {
              this.insertReplyIntoGmail(reply);
            });
            
            actions.appendChild(editBtn);
            actions.appendChild(sendBtn);
            
            card.appendChild(header);
            card.appendChild(contentDiv);
            card.appendChild(actions);
            results.appendChild(card);
          });
        }
      }
    }

    showMeetingSuggestions(data) {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.textContent = '';
          
          const card = document.createElement('div');
          card.className = 'inboxpilot-meeting-card';
          
          const header = document.createElement('div');
          header.className = 'inboxpilot-ai-summary-header';
          const icon = document.createElement('span');
          icon.className = 'inboxpilot-ai-summary-icon';
          icon.textContent = '📅';
          const title = document.createElement('div');
          title.className = 'inboxpilot-ai-summary-title';
          title.textContent = 'MEETING SUGGESTIONS';
          header.appendChild(icon);
          header.appendChild(title);
          card.appendChild(header);
          
          const content = document.createElement('div');
          content.className = 'inboxpilot-ai-summary-content';
          
          if (data.hasMeeting) {
            if (data.suggestedTimes && data.suggestedTimes.length > 0) {
              const timesList = document.createElement('ul');
              timesList.style.listStyle = 'none';
              timesList.style.padding = '0';
              timesList.style.margin = '0';
              
              data.suggestedTimes.forEach((slot, index) => {
                const li = document.createElement('li');
                li.style.padding = '8px 0';
                li.style.borderBottom = '1px solid #e0e0e0';
                const start = new Date(slot.start || slot);
                const end = new Date(slot.end || new Date(start.getTime() + 30 * 60000));
                li.textContent = `${start.toLocaleString()} - ${end.toLocaleString()}`;
                timesList.appendChild(li);
              });
              content.appendChild(timesList);
            } else {
              content.textContent = data.message || 'Meeting detected. Available times will be shown when calendar is connected.';
            }
            
            if (data.attendees && data.attendees.length > 0) {
              const attendeesDiv = document.createElement('div');
              attendeesDiv.style.marginTop = '12px';
              attendeesDiv.style.fontSize = '13px';
              attendeesDiv.style.color = '#5f6368';
              
              // Use createElement instead of innerHTML to avoid TrustedHTML error
              const strong = document.createElement('strong');
              strong.textContent = 'Attendees: ';
              attendeesDiv.appendChild(strong);
              attendeesDiv.appendChild(document.createTextNode(data.attendees.join(', ')));
              
              content.appendChild(attendeesDiv);
            }
          } else {
            content.textContent = data.message || 'No meeting request found in this email.';
          }
          
          card.appendChild(content);
          results.appendChild(card);
        }
      }
    }

    showError(message) {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.textContent = '';
          const errorDiv = document.createElement('div');
          errorDiv.className = 'inboxpilot-error';
          
          // Create error icon and message
          const errorIcon = document.createElement('span');
          errorIcon.textContent = '❌ ';
          errorIcon.style.marginRight = '8px';
          
          const errorText = document.createElement('span');
          errorText.textContent = message;
          
          // Add troubleshooting info if it's a connection error
          if (message.includes('Cannot connect') || message.includes('Failed to fetch')) {
            const helpText = document.createElement('div');
            helpText.style.marginTop = '12px';
            helpText.style.fontSize = '12px';
            helpText.style.color = '#dc2626';
            helpText.style.padding = '8px';
            helpText.style.background = '#fef2f2';
            helpText.style.borderRadius = '6px';
            
            // Use createElement instead of innerHTML to avoid TrustedHTML error
            const strong = document.createElement('strong');
            strong.textContent = 'Quick Fix:';
            helpText.appendChild(strong);
            helpText.appendChild(document.createElement('br'));
            helpText.appendChild(document.createTextNode('1. Make sure backend is running: cd backend && npm run dev'));
            helpText.appendChild(document.createElement('br'));
            helpText.appendChild(document.createTextNode(`2. Check backend URL: ${API_BASE}`));
            helpText.appendChild(document.createElement('br'));
            helpText.appendChild(document.createTextNode('3. Verify CORS is enabled in backend'));
            
            errorDiv.appendChild(errorIcon);
            errorDiv.appendChild(errorText);
            errorDiv.appendChild(helpText);
          } else {
            errorDiv.appendChild(errorIcon);
            errorDiv.appendChild(errorText);
          }
          
          results.appendChild(errorDiv);
        }
      }
    }

    showSuccess(message) {
      if (this.panel) {
        const results = this.panel.querySelector('#inboxpilot-results');
        if (results) {
          results.textContent = '';
          const successDiv = document.createElement('div');
          successDiv.className = 'inboxpilot-success';
          successDiv.textContent = '✓ ' + message;
          results.appendChild(successDiv);
          setTimeout(() => {
            results.textContent = '';
          }, 3000);
        }
      }
    }

    insertIntoCompose(composeBody, text) {
      if (composeBody) {
        // Use textContent to avoid TrustedHTML error
        // Gmail's contenteditable will handle line breaks automatically
        composeBody.textContent = text;
        
        // For line breaks, we can try to insert <br> elements if innerHTML works
        // But fallback to textContent if TrustedHTML blocks it
        try {
          // Try to preserve line breaks with <br>
          const lines = text.split('\n');
          if (lines.length > 1) {
            composeBody.textContent = ''; // Clear first
            lines.forEach((line, index) => {
              if (index > 0) {
                composeBody.appendChild(document.createElement('br'));
              }
              composeBody.appendChild(document.createTextNode(line));
            });
          }
        } catch (e) {
          // TrustedHTML blocked it, use simple textContent
          composeBody.textContent = text;
        }
        
        // Trigger input event for Gmail to recognize the change
        composeBody.dispatchEvent(new Event('input', { bubbles: true }));
        composeBody.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Also try to set the value if it's an input/textarea
        if (composeBody.value !== undefined) {
          composeBody.value = text;
        }
      } else {
        // Fallback: try to find compose body again
        const composeBox = document.querySelector('[role="dialog"]');
        if (composeBox) {
          const body = composeBox.querySelector('[contenteditable="true"]') ||
                      composeBox.querySelector('[role="textbox"]');
          if (body) {
            body.textContent = text;
            body.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
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

  // Wait for DOM to be ready
  function initInboxPilot() {
    try {
      if (document.body && document.querySelector('[role="main"]')) {
        new InboxPilotUI();
      } else {
        setTimeout(initInboxPilot, 500);
      }
    } catch (error) {
      console.error('InboxPilot: Initialization error:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInboxPilot);
  } else {
    initInboxPilot();
  }
})();
