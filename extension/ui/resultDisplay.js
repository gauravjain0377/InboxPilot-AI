/**
 * Result Display Component - Handles displaying different types of results
 */
class ResultDisplay {
  constructor(sidebar) {
    this.sidebar = sidebar;
  }

  showResult(text, title = 'AI Summary') {
    const results = this.sidebar.getResultsContainer();
    if (!results) {
      console.error('InboxPilot: Results container not found');
      return;
    }
    
    results.style.display = 'block';
    results.style.visibility = 'visible';
    results.textContent = '';
    
    const textStr = typeof text === 'string' ? text : String(text || '');
    
    if (!textStr || textStr.trim().length === 0) {
      this.showError('No content to display');
      return;
    }
    
    const card = document.createElement('div');
    card.className = 'inboxpilot-ai-summary-card';
    
    const header = document.createElement('div');
    header.className = 'inboxpilot-ai-summary-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';

    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '8px';
    
    const icon = document.createElement('span');
    icon.className = 'inboxpilot-ai-summary-icon';
    icon.textContent = '✨';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'inboxpilot-ai-summary-title';
    titleDiv.textContent = title.toUpperCase();

    titleContainer.appendChild(icon);
    titleContainer.appendChild(titleDiv);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'transparent';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.padding = '0 4px';
    closeBtn.style.lineHeight = '1';
    closeBtn.style.color = '#5f6368';
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.remove();
    });
    
    header.appendChild(titleContainer);
    header.appendChild(closeBtn);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'inboxpilot-ai-summary-content';
    
    const highlightRegex = /(\$[\d,]+\.?\d*|[\w\s]+LLC|[\w\s]+Inc\.?|[\w\s]+Corp\.?|[\w\s]+Ltd\.?|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?)/gi;
    
    let lastIndex = 0;
    let match;
    
    while ((match = highlightRegex.exec(textStr)) !== null) {
      if (match.index > lastIndex) {
        contentDiv.appendChild(document.createTextNode(textStr.substring(lastIndex, match.index)));
      }
      
      const strong = document.createElement('strong');
      strong.textContent = match[0];
      contentDiv.appendChild(strong);
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < textStr.length) {
      contentDiv.appendChild(document.createTextNode(textStr.substring(lastIndex)));
    }
    
    if (contentDiv.childNodes.length === 0) {
      contentDiv.textContent = textStr;
    }
    
    card.appendChild(header);
    card.appendChild(contentDiv);
    results.appendChild(card);
  }

  showReplies(replies, tone = 'Friendly') {
    const results = this.sidebar.getResultsContainer();
    if (!results) return;
    
    results.textContent = '';
    const repliesList = Array.isArray(replies) ? replies : [replies];
    
    repliesList.forEach((reply, i) => {
      const card = document.createElement('div');
      card.className = 'inboxpilot-reply-card';
      card.setAttribute('data-index', i.toString());
      
      const header = document.createElement('div');
      header.className = 'inboxpilot-reply-header';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      
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

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.textContent = '×';
      closeBtn.title = 'Close';
      closeBtn.style.border = 'none';
      closeBtn.style.background = 'transparent';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '18px';
      closeBtn.style.padding = '0 4px';
      closeBtn.style.lineHeight = '1';
      closeBtn.style.color = '#5f6368';
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.remove();
      });

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.alignItems = 'center';
      right.style.gap = '8px';
      right.appendChild(toneDiv);
      right.appendChild(closeBtn);
      
      header.appendChild(titleDiv);
      header.appendChild(right);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'inboxpilot-reply-content';
      contentDiv.textContent = reply;
      
      const actions = document.createElement('div');
      actions.className = 'inboxpilot-reply-actions';
      
      const editBtn = document.createElement('button');
      editBtn.className = 'inboxpilot-reply-btn inboxpilot-reply-btn-edit';
      editBtn.textContent = 'Discard';
      editBtn.addEventListener('click', () => card.remove());
      
      const useBtn = document.createElement('button');
      useBtn.className = 'inboxpilot-reply-btn inboxpilot-reply-btn-send';
      const useIcon = document.createElement('span');
      useIcon.textContent = '✓';
      useBtn.appendChild(useIcon);
      useBtn.appendChild(document.createTextNode(' Use This Reply'));
      useBtn.addEventListener('click', () => {
        DOMHelpers.insertReplyIntoGmail(reply);
        setTimeout(() => {
          card.style.opacity = '0.5';
          card.style.pointerEvents = 'none';
        }, 300);
      });
      
      actions.appendChild(editBtn);
      actions.appendChild(useBtn);
      
      card.appendChild(header);
      card.appendChild(contentDiv);
      card.appendChild(actions);
      results.appendChild(card);
    });
  }

  showMeetingSuggestions(data) {
    const results = this.sidebar.getResultsContainer();
    if (!results) return;
    
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
        
        data.suggestedTimes.forEach((slot) => {
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

  showToneSelector(callback) {
    const results = this.sidebar.getResultsContainer();
    if (!results) return;
    
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

  showError(message) {
    const results = this.sidebar.getResultsContainer();
    if (!results) return;
    
    results.textContent = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'inboxpilot-error';
    
    const errorIcon = document.createElement('span');
    errorIcon.textContent = '❌ ';
    errorIcon.style.marginRight = '8px';
    
    const errorText = document.createElement('span');
    errorText.textContent = message;
    
    if (message.includes('Cannot connect') || message.includes('Failed to fetch')) {
      const helpText = document.createElement('div');
      helpText.style.marginTop = '12px';
      helpText.style.fontSize = '12px';
      helpText.style.color = '#dc2626';
      helpText.style.padding = '8px';
      helpText.style.background = '#fef2f2';
      helpText.style.borderRadius = '6px';
      
      const strong = document.createElement('strong');
      strong.textContent = 'Quick Fix:';
      helpText.appendChild(strong);
      helpText.appendChild(document.createElement('br'));
      helpText.appendChild(document.createTextNode('1. Make sure backend is running: cd backend && npm run dev'));
      helpText.appendChild(document.createElement('br'));
      helpText.appendChild(document.createTextNode('2. Check backend URL: http://localhost:5000/api'));
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

  showSuccess(message) {
    const results = this.sidebar.getResultsContainer();
    if (!results) return;
    
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

