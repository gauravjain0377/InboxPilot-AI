/**
 * Sidebar UI Component - Creates and manages the sidebar panel
 */
class SidebarUI {
  constructor(panelId = 'inboxpilot-panel') {
    this.panelId = panelId;
    this.panel = null;
  }

  create() {
    try {
      const existing = document.getElementById(this.panelId);
      if (existing) existing.remove();

      const panel = document.createElement('div');
      panel.id = this.panelId;

      const header = this.createHeader();
      const content = this.createContent();

      panel.appendChild(header);
      panel.appendChild(content);

      if (!document.body) {
        setTimeout(() => this.create(), 100);
        return null;
      }

      document.body.appendChild(panel);
      this.panel = panel;
      return panel;
    } catch (error) {
      console.error('InboxPilot: Error creating sidebar panel:', error);
      return null;
    }
  }

  createHeader() {
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
    return header;
  }

  createContent() {
    const content = document.createElement('div');
    content.className = 'inboxpilot-content';
    
    const loading = this.createLoading();
    const emailInfo = document.createElement('div');
    emailInfo.className = 'inboxpilot-email-info';
    emailInfo.id = 'inboxpilot-email-info';
    
    const actions = this.createActions();
    const results = document.createElement('div');
    results.className = 'inboxpilot-results';
    results.id = 'inboxpilot-results';
    
    content.appendChild(loading);
    content.appendChild(emailInfo);
    content.appendChild(actions);
    content.appendChild(results);
    return content;
  }

  createLoading() {
    const loading = document.createElement('div');
    loading.className = 'inboxpilot-loading';
    loading.style.display = 'none';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    const loadingText = document.createElement('span');
    loadingText.textContent = 'Processing...';
    loading.appendChild(spinner);
    loading.appendChild(loadingText);
    return loading;
  }

  createActions() {
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
    
    return actions;
  }

  showLoading(show) {
    if (this.panel) {
      const loading = this.panel.querySelector('.inboxpilot-loading');
      if (loading) loading.style.display = show ? 'flex' : 'none';
    }
  }

  updateEmailInfo(subject, sender, snippet, labels = []) {
    const emailInfo = this.panel?.querySelector('#inboxpilot-email-info');
    if (emailInfo) {
      emailInfo.textContent = '';
      
      const preview = document.createElement('div');
      preview.className = 'email-preview';
      
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
  }

  getResultsContainer() {
    return this.panel?.querySelector('#inboxpilot-results');
  }

  clearResults() {
    const results = this.getResultsContainer();
    if (results) {
      results.textContent = '';
    }
  }
}

