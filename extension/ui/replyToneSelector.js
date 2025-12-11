/**
 * Reply Tone Selector - Shows tone selector in Gmail reply window
 * Matches the AI Quick Reply design from the image
 */
class ReplyToneSelector {
  constructor(actionHandler, apiService) {
    this.actionHandler = actionHandler;
    this.apiService = apiService;
  }

  showInReplyWindow(replyWindow, emailBody) {
    console.log('InboxPilot: showInReplyWindow called', { replyWindow: !!replyWindow, emailBody: emailBody?.substring(0, 50) });
    
    // Remove existing selector if any
    const existing = replyWindow.querySelector('.inboxpilot-ai-quick-reply');
    if (existing) {
      console.log('InboxPilot: Removing existing component');
      existing.remove();
    }

    // Remove existing draft if any
    const existingDraft = replyWindow.querySelector('.inboxpilot-ai-draft-card');
    if (existingDraft) existingDraft.remove();

    const container = document.createElement('div');
    container.className = 'inboxpilot-ai-quick-reply';
    // Ensure it's visible
    container.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';

    // Header with title + close button
    const header = document.createElement('div');
    header.className = 'inboxpilot-ai-quick-reply-header';
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;';

    const title = document.createElement('div');
    title.className = 'inboxpilot-ai-quick-reply-title';
    const titleIcon = document.createElement('span');
    titleIcon.textContent = '✨';
    title.appendChild(titleIcon);
    title.appendChild(document.createTextNode(' AI Quick Reply'));

    const closeBtn = document.createElement('button');
    closeBtn.className = 'inboxpilot-ai-quick-reply-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = 'border: none; background: transparent; cursor: pointer; font-size: 18px; padding: 0 4px; line-height: 1; color: #5f6368;';
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.remove();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Tone buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'inboxpilot-ai-quick-reply-buttons';
    
    const tones = [
      { value: 'formal', label: 'Professional' },
      { value: 'friendly', label: 'Friendly' },
      { value: 'concise', label: 'Concise' },
      { value: 'negative', label: 'Negative' }
    ];
    
    let selectedTone = 'formal';
    
    tones.forEach(tone => {
      const btn = document.createElement('button');
      btn.className = 'inboxpilot-ai-quick-reply-tone-btn';
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-tone', tone.value);
      btn.textContent = tone.label;
      
      // Add selected state styling
      if (tone.value === selectedTone) {
        btn.classList.add('selected');
      }
      
      btn.addEventListener('click', () => {
        // Update selected tone
        selectedTone = tone.value;
        
        // Update button styles
        buttonsContainer.querySelectorAll('button').forEach(b => {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        
        // Update placeholder
        const placeholder = container.querySelector('.inboxpilot-ai-quick-reply-placeholder');
        if (placeholder) {
          const toneLabels = {
            'formal': 'professional',
            'friendly': 'friendly',
            'concise': 'concise',
            'negative': 'negative'
          };
          placeholder.textContent = `Draft a ${toneLabels[selectedTone]} reply...`;
        }
      });
      
      buttonsContainer.appendChild(btn);
    });
    
    // Input field (for user to optionally add context)
    const inputContainer = document.createElement('div');
    inputContainer.className = 'inboxpilot-ai-quick-reply-input-container';
    inputContainer.style.position = 'relative';
    
    const input = document.createElement('div');
    input.className = 'inboxpilot-ai-quick-reply-input';
    input.setAttribute('contenteditable', 'true');
    input.setAttribute('role', 'textbox');
    input.setAttribute('data-placeholder', 'Draft a professional reply...');
    
    // Create placeholder element
    const placeholder = document.createElement('div');
    placeholder.className = 'inboxpilot-ai-quick-reply-placeholder';
    placeholder.textContent = 'Draft a professional reply...';
    placeholder.style.cssText = 'position: absolute; top: 12px; left: 12px; color: #9aa0a6; pointer-events: none; font-size: 14px;';
    inputContainer.appendChild(placeholder);
    
    // Handle placeholder visibility
    const updatePlaceholder = () => {
      if (!input.textContent.trim()) {
        placeholder.style.display = 'block';
      } else {
        placeholder.style.display = 'none';
      }
    };
    
    input.addEventListener('focus', () => {
      updatePlaceholder();
    });
    
    input.addEventListener('blur', updatePlaceholder);
    
    input.addEventListener('input', () => {
      updatePlaceholder();
    });
    
    // Set initial placeholder
    updatePlaceholder();
    
    inputContainer.appendChild(input);
    
    // Add action buttons container
    const actionButtons = document.createElement('div');
    actionButtons.className = 'inboxpilot-ai-quick-reply-actions';
    
    // Generate button
    const generateBtn = document.createElement('button');
    generateBtn.className = 'inboxpilot-ai-quick-reply-generate-btn';
    generateBtn.textContent = 'Generate';
    generateBtn.setAttribute('type', 'button');
    generateBtn.addEventListener('click', async () => {
      await this.generateReply(container, emailBody, selectedTone, input.textContent.trim(), replyWindow);
    });
    
    // Enhance button - for enhancing user-written text
    const enhanceBtn = document.createElement('button');
    enhanceBtn.className = 'inboxpilot-ai-quick-reply-enhance-btn';
    enhanceBtn.textContent = '✨ Enhance';
    enhanceBtn.setAttribute('type', 'button');
    enhanceBtn.setAttribute('title', 'Enhance text you\'ve written with selected tone');
    enhanceBtn.addEventListener('click', async () => {
      const replyBody = replyWindow.querySelector('[contenteditable="true"][g_editable="true"]') ||
                       replyWindow.querySelector('[contenteditable="true"]') ||
                       replyWindow.querySelector('[role="textbox"]');
      const userText = replyBody?.textContent?.trim() || '';
      
      if (!userText) {
        // If no text, just generate a reply
        await this.generateReply(container, emailBody, selectedTone, input.textContent.trim(), replyWindow);
      } else {
        // Enhance the user's written text
        await this.enhanceUserText(container, userText, selectedTone, replyWindow, replyBody);
      }
    });
    
    actionButtons.appendChild(generateBtn);
    actionButtons.appendChild(enhanceBtn);
    
    // Build final layout
    container.appendChild(header);
    container.appendChild(buttonsContainer);
    container.appendChild(inputContainer);
    container.appendChild(actionButtons);
    
    // Find the best insertion point in the reply window
    // Try multiple strategies to find where to insert the component
    let inserted = false;
    
    // Strategy 1 (PRIMARY): place AI assistant just ABOVE the Send bar,
    // so the user writes in the native Gmail box and AI sits near the bottom.
    const sendBar = replyWindow.querySelector('.btC');
    if (sendBar && sendBar.parentElement) {
      sendBar.parentElement.insertBefore(container, sendBar);
      inserted = true;
      console.log('InboxPilot: Inserted AI Quick Reply above Send bar (primary)');
    }
    
    // Strategy 2: place AI assistant AFTER the reply body (still below where user types)
    if (!inserted) {
      const replyBody = replyWindow.querySelector('[contenteditable="true"][g_editable="true"]') ||
                       replyWindow.querySelector('[contenteditable="true"]') ||
                       replyWindow.querySelector('[role="textbox"]');
      
      if (replyBody && replyBody.parentElement) {
        const parent = replyBody.parentElement;
        if (replyBody.nextSibling) {
          parent.insertBefore(container, replyBody.nextSibling);
        } else {
          parent.appendChild(container);
        }
        inserted = true;
        console.log('InboxPilot: Inserted AI Quick Reply after reply body (fallback)');
      }
    }
    
    // Strategy 3: If Gmail's "Help me write" block exists but neither of the above worked,
    // keep our component close to it.
    if (!inserted) {
      const helpMeWrite = replyWindow.querySelector('[aria-label*="Help me write"]')?.closest('div')?.parentElement;
      if (helpMeWrite && helpMeWrite.parentElement) {
        const parent = helpMeWrite.parentElement;
        if (helpMeWrite.nextSibling) {
          parent.insertBefore(container, helpMeWrite.nextSibling);
        } else {
          parent.appendChild(container);
        }
        inserted = true;
        console.log('InboxPilot: Inserted AI Quick Reply after Help me write (secondary fallback)');
      }
    }
    
    // Strategy 4: Find compose area container
    if (!inserted) {
      const composeArea = replyWindow.querySelector('.Am') ||
                         replyWindow.querySelector('.aO') ||
                         replyWindow.querySelector('[role="textbox"]')?.parentElement?.parentElement;
      
      if (composeArea) {
        if (composeArea.firstChild) {
          composeArea.insertBefore(container, composeArea.firstChild);
        } else {
          composeArea.appendChild(container);
        }
        inserted = true;
        console.log('InboxPilot: Inserted in compose area');
      }
    }
    
    // Strategy 4: Last resort - insert at beginning of dialog
    if (!inserted) {
      if (replyWindow.firstChild) {
        replyWindow.insertBefore(container, replyWindow.firstChild);
      } else {
        replyWindow.appendChild(container);
      }
      console.log('InboxPilot: Inserted at beginning of dialog (fallback)');
    }
    
    // Force visibility
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    
    // Scroll into view if needed
    setTimeout(() => {
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    // Handle input enter key to generate (Ctrl+Enter or Cmd+Enter)
    input.addEventListener('keydown', async (e) => {
      if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey)) || 
          (e.key === 'Enter' && !e.shiftKey && !input.textContent.trim())) {
        e.preventDefault();
        await this.generateReply(container, emailBody, selectedTone, input.textContent.trim(), replyWindow);
      }
    });
    
    // Add a visual indicator that user can type or press Enter to generate
    // The placeholder already indicates this, so we don't need a separate click handler
  }

  async generateReply(container, emailBody, tone, userContext, replyWindow) {
    // Show loading state
    const input = container.querySelector('.inboxpilot-ai-quick-reply-input');
    const generateBtn = container.querySelector('.inboxpilot-ai-quick-reply-generate-btn');
    const placeholder = container.querySelector('.inboxpilot-ai-quick-reply-placeholder');
    
    if (input) {
      input.contentEditable = 'false';
      input.textContent = 'Generating reply...';
      input.classList.add('generating');
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';
    }
    
    const buttons = container.querySelectorAll('.inboxpilot-ai-quick-reply-tone-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.6';
    });
    
    try {
      // Get auth token for signature
      const token = this.apiService ? await this.apiService.getAuthToken() : null;
      
      // Call API to generate reply
      const result = await this.actionHandler(emailBody, tone, replyWindow, userContext, token);
      
      // Hide the quick reply selector
      container.style.display = 'none';
      
      // Show the generated draft card
      this.showDraftCard(replyWindow, result, tone);
      
    } catch (error) {
      console.error('Error generating reply:', error);
      
      // Show error
      if (input) {
        input.textContent = 'Error: ' + (error.message || 'Failed to generate reply');
        input.classList.add('error');
        input.classList.remove('generating');
        input.contentEditable = 'true';
      }
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
      }
      
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
      });
    }
  }

  showDraftCard(replyWindow, replyText, tone) {
    // Remove existing draft if any
    const existing = replyWindow.querySelector('.inboxpilot-ai-draft-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = 'inboxpilot-ai-draft-card';
    
    // Header
    const header = document.createElement('div');
    header.className = 'inboxpilot-ai-draft-header';
    
    const title = document.createElement('div');
    title.className = 'inboxpilot-ai-draft-title';
    const starIcon = document.createElement('span');
    starIcon.textContent = '✨';
    starIcon.style.marginRight = '4px';
    const titleText = document.createElement('span');
    titleText.textContent = 'AI Draft (';
    const toneSpan = document.createElement('span');
    toneSpan.textContent = this.getToneLabel(tone);
    toneSpan.style.textTransform = 'capitalize';
    const closingText = document.createElement('span');
    closingText.textContent = ')';
    title.appendChild(starIcon);
    title.appendChild(titleText);
    title.appendChild(toneSpan);
    title.appendChild(closingText);
    
    const discardLink = document.createElement('a');
    discardLink.className = 'inboxpilot-ai-draft-discard';
    discardLink.href = '#';
    discardLink.textContent = 'Discard';
    discardLink.addEventListener('click', (e) => {
      e.preventDefault();
      card.remove();
      // Show the quick reply selector again
      const quickReply = replyWindow.querySelector('.inboxpilot-ai-quick-reply');
      if (quickReply) {
        quickReply.style.display = 'block';
      }
    });
    
    header.appendChild(title);
    header.appendChild(discardLink);
    
    // Content
    const content = document.createElement('div');
    content.className = 'inboxpilot-ai-draft-content';
    content.textContent = replyText;
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'inboxpilot-ai-draft-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'inboxpilot-ai-draft-btn inboxpilot-ai-draft-btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      // Insert into Gmail compose area for editing
      const replyBody = replyWindow.querySelector('[contenteditable="true"][g_editable="true"]') ||
                       replyWindow.querySelector('[contenteditable="true"]') ||
                       replyWindow.querySelector('[role="textbox"]');
      if (replyBody) {
        replyBody.textContent = '';
        const lines = replyText.split('\n');
        lines.forEach((line, index) => {
          if (index > 0) {
            replyBody.appendChild(document.createElement('br'));
          }
          replyBody.appendChild(document.createTextNode(line));
        });
        replyBody.dispatchEvent(new Event('input', { bubbles: true }));
        replyBody.focus();
      }
      card.remove();
    });
    
    const sendBtn = document.createElement('button');
    sendBtn.className = 'inboxpilot-ai-draft-btn inboxpilot-ai-draft-btn-send';
    const sendIcon = document.createElement('span');
    sendIcon.textContent = '✈';
    sendIcon.style.marginRight = '6px';
    sendBtn.appendChild(sendIcon);
    sendBtn.appendChild(document.createTextNode('Send Reply'));
    sendBtn.addEventListener('click', () => {
      // Insert into Gmail and trigger send
      const replyBody = replyWindow.querySelector('[contenteditable="true"][g_editable="true"]') ||
                       replyWindow.querySelector('[contenteditable="true"]') ||
                       replyWindow.querySelector('[role="textbox"]');
      if (replyBody) {
        replyBody.textContent = '';
        const lines = replyText.split('\n');
        lines.forEach((line, index) => {
          if (index > 0) {
            replyBody.appendChild(document.createElement('br'));
          }
          replyBody.appendChild(document.createTextNode(line));
        });
        replyBody.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Try to find and click send button
        setTimeout(() => {
          const sendButton = replyWindow.querySelector('[aria-label*="Send"]') ||
                           replyWindow.querySelector('[data-tooltip*="Send"]') ||
                           replyWindow.querySelector('div[role="button"][aria-label*="Send"]');
          if (sendButton) {
            sendButton.click();
          }
        }, 100);
      }
      card.remove();
    });
    
    actions.appendChild(editBtn);
    actions.appendChild(sendBtn);
    
    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(actions);
    
    // Insert the card
    const quickReply = replyWindow.querySelector('.inboxpilot-ai-quick-reply');
    if (quickReply && quickReply.nextSibling) {
      // Place draft card directly after the quick-reply bar (which itself is below the reply text)
      quickReply.parentElement.insertBefore(card, quickReply.nextSibling);
    } else if (quickReply) {
      quickReply.parentElement.appendChild(card);
    } else {
      // If quick-reply is gone, fall back to placing the draft AFTER the reply body
      const replyBody = replyWindow.querySelector('[contenteditable="true"][g_editable="true"]') ||
                       replyWindow.querySelector('[contenteditable="true"]') ||
                       replyWindow.querySelector('[role="textbox"]');
      if (replyBody && replyBody.parentElement) {
        const parent = replyBody.parentElement;
        if (replyBody.nextSibling) {
          parent.insertBefore(card, replyBody.nextSibling);
        } else {
          parent.appendChild(card);
        }
      } else {
        // Last resort: append at the end of the reply window so it never covers the text
        replyWindow.appendChild(card);
      }
    }
  }

  async enhanceUserText(container, userText, tone, replyWindow, replyBody) {
    // Show loading state
    const enhanceBtn = container.querySelector('.inboxpilot-ai-quick-reply-enhance-btn');
    const generateBtn = container.querySelector('.inboxpilot-ai-quick-reply-generate-btn');
    const buttons = container.querySelectorAll('.inboxpilot-ai-quick-reply-tone-btn');
    
    if (enhanceBtn) {
      enhanceBtn.disabled = true;
      enhanceBtn.textContent = 'Enhancing...';
    }
    if (generateBtn) {
      generateBtn.disabled = true;
    }
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.6';
    });
    
    try {
      // Get auth token
      const token = this.apiService ? await this.apiService.getAuthToken() : null;
      
      // Call API to enhance
      const toneLabels = {
        'formal': 'professional',
        'friendly': 'friendly',
        'assertive': 'assertive',
        'short': 'brief and concise',
        'concise': 'concise',
        'negative': 'polite but firm, expressing disagreement or concerns'
      };
      const toneLabel = toneLabels[tone] || 'professional';
      
      // Use the API service directly to enhance text
      const result = await this.apiService.call('/ai/rewrite', {
        text: userText,
        instruction: `Enhance and improve this text with a ${toneLabel} tone while keeping the same meaning and intent. Make it more polished and professional.`
      });
      
      const enhancedText = result.rewritten || result.text || result;
      
      // Insert enhanced text into reply body
      if (replyBody && enhancedText) {
        replyBody.textContent = '';
        const lines = enhancedText.split('\n');
        lines.forEach((line, index) => {
          if (index > 0) {
            replyBody.appendChild(document.createElement('br'));
          }
          replyBody.appendChild(document.createTextNode(line));
        });
        replyBody.dispatchEvent(new Event('input', { bubbles: true }));
        replyBody.focus();
      }
      
    } catch (error) {
      console.error('Error enhancing text:', error);
      alert('Failed to enhance text: ' + (error.message || 'Unknown error'));
    } finally {
      if (enhanceBtn) {
        enhanceBtn.disabled = false;
        enhanceBtn.textContent = '✨ Enhance';
      }
      if (generateBtn) {
        generateBtn.disabled = false;
      }
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
      });
    }
  }

  getToneLabel(tone) {
    const labels = {
      'formal': 'Professional',
      'friendly': 'Friendly',
      'concise': 'Concise',
      'negative': 'Negative',
      'assertive': 'Assertive',
      'short': 'Brief'
    };
    return labels[tone] || 'Friendly';
  }
}

// Ensure it's available globally
try {
  if (typeof window !== 'undefined') {
    window.ReplyToneSelector = ReplyToneSelector;
  }
  console.log('InboxPilot: ReplyToneSelector class defined and registered');
} catch (error) {
  console.error('InboxPilot: Error registering ReplyToneSelector:', error);
}

