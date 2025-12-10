/**
 * DOM Helpers - Utility functions for DOM manipulation
 */
class DOMHelpers {
  static insertIntoCompose(composeBody, text) {
    if (composeBody) {
      try {
        const lines = text.split('\n');
        if (lines.length > 1) {
          composeBody.textContent = '';
          lines.forEach((line, index) => {
            if (index > 0) {
              composeBody.appendChild(document.createElement('br'));
            }
            composeBody.appendChild(document.createTextNode(line));
          });
        } else {
          composeBody.textContent = text;
        }
      } catch (e) {
        composeBody.textContent = text;
      }
      
      composeBody.dispatchEvent(new Event('input', { bubbles: true }));
      composeBody.dispatchEvent(new Event('change', { bubbles: true }));
      
      if (composeBody.value !== undefined) {
        composeBody.value = text;
      }
    } else {
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

  static insertReplyIntoGmail(text) {
    const replyBody = document.querySelector('[role="dialog"] [contenteditable="true"][g_editable="true"]') ||
                     document.querySelector('[role="dialog"] [contenteditable="true"]') ||
                     document.querySelector('[contenteditable="true"][aria-label*="Message Body"]') ||
                     document.querySelector('[contenteditable="true"][g_editable="true"]') ||
                     document.querySelector('[contenteditable="true"]');
    
    if (replyBody) {
      replyBody.textContent = '';
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (index > 0) {
          replyBody.appendChild(document.createElement('br'));
        }
        replyBody.appendChild(document.createTextNode(line));
      });
      
      replyBody.dispatchEvent(new Event('input', { bubbles: true }));
      replyBody.dispatchEvent(new Event('change', { bubbles: true }));
      replyBody.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      replyBody.focus();
      
      const replyWindow = replyBody.closest('[role="dialog"]');
      if (replyWindow) {
        replyWindow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  static openGmailReplyWindow(callback) {
    const replyButton = document.querySelector('[data-tooltip="Reply"]') || 
                       document.querySelector('[aria-label*="Reply"]') ||
                       document.querySelector('[aria-label*="reply"]') ||
                       document.querySelector('[data-tooltip*="Reply"]') ||
                       document.querySelector('div[role="button"][aria-label*="Reply"]');
    
    if (replyButton) {
      replyButton.click();
      
      const checkReplyWindow = (attempts = 0) => {
        const replyBody = document.querySelector('[contenteditable="true"][g_editable="true"]') ||
                         document.querySelector('[role="dialog"] [contenteditable="true"]') ||
                         document.querySelector('[contenteditable="true"][aria-label*="Message Body"]');
        
        if (replyBody) {
          if (callback) callback();
        } else if (attempts < 10) {
          setTimeout(() => checkReplyWindow(attempts + 1), 200);
        } else {
          if (callback) callback();
        }
      };
      
      checkReplyWindow();
    } else {
      if (callback) callback();
    }
  }
}

