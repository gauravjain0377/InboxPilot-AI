/**
 * Reply Tone Selector - Shows tone selector in Gmail reply window
 */
class ReplyToneSelector {
  constructor(actionHandler) {
    this.actionHandler = actionHandler;
  }

  showInReplyWindow(replyWindow, emailBody) {
    // Remove existing selector if any
    const existing = replyWindow.querySelector('.inboxpilot-reply-tone-selector');
    if (existing) existing.remove();

    const selector = document.createElement('div');
    selector.className = 'inboxpilot-reply-tone-selector';
    
    const label = document.createElement('div');
    label.className = 'inboxpilot-reply-tone-label';
    label.textContent = '✨ AI Reply Generator';
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'inboxpilot-reply-tone-buttons';
    
    const tones = [
      { value: 'friendly', label: 'Friendly', icon: '😊' },
      { value: 'formal', label: 'Professional', icon: '💼' },
      { value: 'assertive', label: 'Assertive', icon: '💪' },
      { value: 'short', label: 'Brief', icon: '✂️' }
    ];
    
    tones.forEach(tone => {
      const btn = document.createElement('button');
      btn.className = 'inboxpilot-reply-tone-btn';
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-tone', tone.value);
      btn.textContent = `${tone.icon} ${tone.label}`;
      
      btn.addEventListener('click', async () => {
        // Disable all buttons
        buttonsContainer.querySelectorAll('button').forEach(b => {
          b.disabled = true;
          b.style.opacity = '0.6';
        });
        
        // Show generating message
        const generating = document.createElement('div');
        generating.className = 'inboxpilot-generating';
        generating.textContent = 'Generating reply...';
        selector.appendChild(generating);
        
        try {
          await this.actionHandler(emailBody, tone.value, replyWindow);
          selector.remove();
        } catch (error) {
          generating.textContent = 'Error: ' + error.message;
          generating.style.color = '#dc2626';
          buttonsContainer.querySelectorAll('button').forEach(b => {
            b.disabled = false;
            b.style.opacity = '1';
          });
        }
      });
      
      buttonsContainer.appendChild(btn);
    });
    
    selector.appendChild(label);
    selector.appendChild(buttonsContainer);
    
    // Find reply body area
    const replyBody = replyWindow.querySelector('[contenteditable="true"][g_editable="true"]') ||
                     replyWindow.querySelector('[contenteditable="true"]') ||
                     replyWindow.querySelector('[role="textbox"]');
    
    if (replyBody) {
      // Insert before reply body
      const parent = replyBody.parentElement;
      if (parent) {
        parent.insertBefore(selector, replyBody);
      } else {
        replyWindow.insertBefore(selector, replyWindow.firstChild);
      }
    } else {
      replyWindow.insertBefore(selector, replyWindow.firstChild);
    }
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

