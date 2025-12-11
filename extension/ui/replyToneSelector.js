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
    
    let selectedTone = 'friendly';
    
    tones.forEach(tone => {
      const btn = document.createElement('button');
      btn.className = 'inboxpilot-reply-tone-btn';
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-tone', tone.value);
      btn.textContent = `${tone.icon} ${tone.label}`;
      
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
      });
      
      buttonsContainer.appendChild(btn);
    });
    
    // Add Generate button
    const generateBtn = document.createElement('button');
    generateBtn.className = 'inboxpilot-reply-generate-btn';
    generateBtn.setAttribute('type', 'button');
    generateBtn.textContent = 'Generate';
    generateBtn.style.cssText = 'margin-top: 12px; padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; width: 100%;';
    
    generateBtn.addEventListener('click', async () => {
      // Disable all buttons
      buttonsContainer.querySelectorAll('button').forEach(b => {
        b.disabled = true;
        b.style.opacity = '0.6';
      });
      generateBtn.disabled = true;
      generateBtn.style.opacity = '0.6';
      generateBtn.textContent = 'Generating...';
      
      // Show generating message
      const generating = document.createElement('div');
      generating.className = 'inboxpilot-generating';
      generating.textContent = 'Generating reply...';
      generating.style.cssText = 'margin-top: 12px; padding: 8px; background: #e8f0fe; border-radius: 4px; color: #1a73e8; text-align: center;';
      selector.appendChild(generating);
      
      try {
        await this.actionHandler(emailBody, selectedTone, replyWindow);
        selector.remove();
      } catch (error) {
        generating.textContent = 'Error: ' + error.message;
        generating.style.color = '#dc2626';
        generating.style.background = '#fef2f2';
        buttonsContainer.querySelectorAll('button').forEach(b => {
          b.disabled = false;
          b.style.opacity = '1';
        });
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
        generateBtn.textContent = 'Generate';
      }
    });
    
    selector.appendChild(label);
    selector.appendChild(buttonsContainer);
    selector.appendChild(generateBtn);
    
    // Find reply body area - try to insert near "Help me write" or before compose area
    const helpMeWrite = replyWindow.querySelector('[aria-label*="Help me write"]')?.parentElement?.parentElement;
    const replyBody = replyWindow.querySelector('[contenteditable="true"][g_editable="true"]') ||
                     replyWindow.querySelector('[contenteditable="true"]') ||
                     replyWindow.querySelector('[role="textbox"]');
    
    if (helpMeWrite && helpMeWrite.nextSibling) {
      // Insert after "Help me write" section
      helpMeWrite.parentElement.insertBefore(selector, helpMeWrite.nextSibling);
    } else if (replyBody) {
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

