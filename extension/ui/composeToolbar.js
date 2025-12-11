/**
 * Compose Toolbar Component - Creates AI assistant toolbar in compose window
 */
class ComposeToolbar {
  constructor(actionHandler) {
    this.actionHandler = actionHandler;
    this.observer = null;
  }

  inject() {
    console.log('InboxPilot: ComposeToolbar inject() called');
    
    // Initial injection attempt
    setTimeout(() => {
      this.checkAndInject();
    }, 500);
    
    // Watch for compose window changes
    this.observer = new MutationObserver(() => {
      this.checkAndInject();
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  checkAndInject() {
    // Find all compose windows (dialogs)
    const composeBoxes = document.querySelectorAll('[role="dialog"]');
    
    composeBoxes.forEach(composeBox => {
      // Skip if already has toolbar
      if (composeBox.querySelector('.inboxpilot-compose-toolbar')) {
        return;
      }
      
      // Check if it's actually a compose window (has compose body)
      const hasComposeBody = composeBox.querySelector('[contenteditable="true"][g_editable="true"]') ||
                            composeBox.querySelector('[contenteditable="true"]') ||
                            composeBox.querySelector('[role="textbox"]');
      
      // Also check for To field or subject box
      const hasToField = composeBox.querySelector('input[aria-label*="To"]') ||
                        composeBox.querySelector('[aria-label*="To"]');
      const hasSubjectBox = composeBox.querySelector('[name="subjectbox"]');
      
      // It's a compose window if it has compose body AND (To field OR subject box)
      // This covers both new compose and reply windows
      const isComposeWindow = hasComposeBody && (hasToField || hasSubjectBox);
      
      if (isComposeWindow) {
        console.log('InboxPilot: Found compose window, injecting toolbar', {
          hasComposeBody: !!hasComposeBody,
          hasToField: !!hasToField,
          hasSubjectBox: !!hasSubjectBox
        });
        this.create(composeBox);
      }
    });
  }

  create(composeBox) {
    // Check if already exists
    if (composeBox.querySelector('.inboxpilot-compose-toolbar')) {
      console.log('InboxPilot: Compose toolbar already exists');
      return;
    }
    
    console.log('InboxPilot: Creating compose toolbar');
    
    const toolbar = document.createElement('div');
    toolbar.className = 'inboxpilot-compose-toolbar';
    
    const content = document.createElement('div');
    content.className = 'inboxpilot-toolbar-content';
    
    const label = document.createElement('span');
    label.className = 'inboxpilot-label';
    const icon = document.createElement('span');
    icon.textContent = '✨';
    icon.style.marginRight = '4px';
    label.appendChild(icon);
    label.appendChild(document.createTextNode('AI Assistant'));
    
    const buttons = document.createElement('div');
    buttons.className = 'inboxpilot-toolbar-buttons';
    
    // Tone selector as simple buttons (no dropdown for better UX)
    const toneContainer = document.createElement('div');
    toneContainer.className = 'inboxpilot-tone-container';
    
    const toneLabel = document.createElement('span');
    toneLabel.className = 'inboxpilot-tone-label-text';
    toneLabel.textContent = 'Tone:';
    toneContainer.appendChild(toneLabel);
    
    // Hidden input that stores the selected tone value (used by actionHandlers)
    const toneInput = document.createElement('input');
    toneInput.type = 'hidden';
    toneInput.className = 'inboxpilot-tone-select';
    toneInput.value = 'friendly';
    
    const toneButtonsWrap = document.createElement('div');
    toneButtonsWrap.className = 'inboxpilot-compose-tone-buttons';
    
    const toneOptions = [
      { value: 'formal', label: 'Professional' },
      { value: 'friendly', label: 'Friendly' },
      { value: 'concise', label: 'Concise' },
      { value: 'negative', label: 'Negative' }
    ];
    
    toneOptions.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inboxpilot-compose-tone-btn';
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;
      
      if (opt.value === 'friendly') {
        btn.classList.add('selected');
      }
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Update selected state
        toneButtonsWrap.querySelectorAll('.inboxpilot-compose-tone-btn').forEach((b) => {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        toneInput.value = opt.value;
      });
      
      toneButtonsWrap.appendChild(btn);
    });
    
    toneContainer.appendChild(toneButtonsWrap);
    buttons.appendChild(toneContainer);
    buttons.appendChild(toneInput);
    
    // Simplified actions - removed redundant "Change Tone" since we have selector
    const toolbarActions = [
      { action: 'enhance', icon: '✨', text: 'Enhance', title: 'Enhance email with selected tone', primary: true },
      { action: 'rewrite', icon: '✏️', text: 'Rewrite', title: 'Rewrite email' },
      { action: 'expand', icon: '📝', text: 'Expand', title: 'Expand email' },
      { action: 'shorten', icon: '✂️', text: 'Shorten', title: 'Shorten email' }
    ];
    
    toolbarActions.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'inboxpilot-toolbar-btn' + (item.primary ? ' primary' : '');
      btn.setAttribute('data-action', item.action);
      btn.setAttribute('title', item.title);
      btn.setAttribute('type', 'button');
      
      // Create icon and text separately for better styling
      const iconSpan = document.createElement('span');
      iconSpan.className = 'inboxpilot-toolbar-icon';
      iconSpan.textContent = item.icon;
      
      const textSpan = document.createElement('span');
      textSpan.className = 'inboxpilot-toolbar-text';
      textSpan.textContent = item.text;
      
      btn.appendChild(iconSpan);
      btn.appendChild(textSpan);
      buttons.appendChild(btn);
    });
    
    content.appendChild(label);
    content.appendChild(buttons);
    toolbar.appendChild(content);

    // Try multiple insertion points - prioritize visible areas
    let inserted = false;
    
    // Strategy 1: Find compose body container and insert before it
    const composeBody = composeBox.querySelector('[contenteditable="true"][g_editable="true"]')?.parentElement ||
                       composeBox.querySelector('[contenteditable="true"]')?.parentElement ||
                       composeBox.querySelector('[role="textbox"]')?.parentElement ||
                       composeBox.querySelector('.Am') ||
                       composeBox.querySelector('.aO') ||
                       composeBox.querySelector('.aZ6');
    
    if (composeBody && composeBody.parentElement) {
      const parent = composeBody.parentElement;
      parent.insertBefore(toolbar, composeBody);
      inserted = true;
      console.log('InboxPilot: Inserted toolbar before compose body');
    }
    
    // Strategy 2: Find "To" field container and insert after it
    if (!inserted) {
      const toFieldContainer = composeBox.querySelector('.wO')?.parentElement ||
                              composeBox.querySelector('input[aria-label*="To"]')?.closest('div')?.parentElement;
      
      if (toFieldContainer && toFieldContainer.parentElement) {
        const parent = toFieldContainer.parentElement;
        if (toFieldContainer.nextSibling) {
          parent.insertBefore(toolbar, toFieldContainer.nextSibling);
        } else {
          parent.appendChild(toolbar);
        }
        inserted = true;
        console.log('InboxPilot: Inserted toolbar after To field');
      }
    }
    
    // Strategy 3: Find subject box and insert after it
    if (!inserted) {
      const subjectBox = composeBox.querySelector('[name="subjectbox"]')?.parentElement ||
                        composeBox.querySelector('input[name="subjectbox"]')?.parentElement;
      
      if (subjectBox && subjectBox.parentElement) {
        const parent = subjectBox.parentElement;
        if (subjectBox.nextSibling) {
          parent.insertBefore(toolbar, subjectBox.nextSibling);
        } else {
          parent.appendChild(toolbar);
        }
        inserted = true;
        console.log('InboxPilot: Inserted toolbar after subject box');
      }
    }
    
    // Strategy 4: Last resort - insert at beginning of dialog
    if (!inserted) {
      if (composeBox.firstChild) {
        composeBox.insertBefore(toolbar, composeBox.firstChild);
      } else {
        composeBox.appendChild(toolbar);
      }
      console.log('InboxPilot: Inserted toolbar at beginning of dialog (fallback)');
    }
    
    // Force visibility with highest priority
    toolbar.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 1000 !important;';
    
    // Verify it's visible after a short delay
    setTimeout(() => {
      const rect = toolbar.getBoundingClientRect();
      const computed = window.getComputedStyle(toolbar);
      console.log('InboxPilot: Toolbar visibility check:', {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
      });
      
      if (rect.width === 0 || rect.height === 0) {
        console.warn('InboxPilot: Toolbar not visible, trying alternative insertion');
        // Try inserting directly into body as last resort
        const composeBodyArea = composeBox.querySelector('[contenteditable="true"]');
        if (composeBodyArea && composeBodyArea.parentElement) {
          composeBodyArea.parentElement.insertBefore(toolbar, composeBodyArea);
        }
      }
    }, 200);

    // Store toolbar reference for loading states
    this.currentToolbar = toolbar;
    
    toolbar.querySelectorAll('.inboxpilot-toolbar-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const actionBtn = e.target.closest('.inboxpilot-toolbar-btn');
        if (actionBtn && actionBtn.dataset.action) {
          // Show loading state
          const originalText = actionBtn.querySelector('.inboxpilot-toolbar-text')?.textContent || '';
          const originalIcon = actionBtn.querySelector('.inboxpilot-toolbar-icon')?.textContent || '';
          
          actionBtn.disabled = true;
          actionBtn.classList.add('loading');
          if (actionBtn.querySelector('.inboxpilot-toolbar-text')) {
            actionBtn.querySelector('.inboxpilot-toolbar-text').textContent = 'Processing...';
          }
          
          try {
            // For enhance action, loading is handled in actionHandlers
            // For other actions, show loading here
            if (actionBtn.dataset.action !== 'enhance') {
              await this.actionHandler(actionBtn.dataset.action, composeBox);
            } else {
              // Enhance handles its own loading
              await this.actionHandler(actionBtn.dataset.action, composeBox);
              // Loading will be removed in actionHandlers
              return; // Don't remove loading here, it's handled in actionHandlers
            }
          } catch (error) {
            console.error('InboxPilot: Compose action error:', error);
          } finally {
            // Remove loading state (only if not enhance action)
            if (actionBtn.dataset.action !== 'enhance') {
              actionBtn.disabled = false;
              actionBtn.classList.remove('loading');
              if (actionBtn.querySelector('.inboxpilot-toolbar-text')) {
                actionBtn.querySelector('.inboxpilot-toolbar-text').textContent = originalText;
              }
            }
          }
        }
      });
    });
  }
}

