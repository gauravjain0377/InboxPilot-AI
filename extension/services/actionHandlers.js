/**
 * Action Handlers - Handles all AI actions (summarize, reply, etc.)
 */
class ActionHandlers {
  constructor(apiService, emailExtractor, resultDisplay, domHelpers) {
    this.api = apiService;
    this.extractor = emailExtractor;
    this.display = resultDisplay;
    this.domHelpers = domHelpers;
  }

  async handleAction(action) {
    const emailContent = this.extractor.getCurrentEmailContent();
    if (!emailContent.body || emailContent.body.trim().length === 0) {
      this.display.showError(action, 'No email content found. Please open an email first.');
      return;
    }

    this.display.showLoading(action, true);

    try {
      let result;
      switch (action) {
        case 'summarize-email':
          result = await this.api.call('/ai/summarize', { emailBody: emailContent.body });
          console.log('InboxPilot: Summarize result received:', result);
          console.log('InboxPilot: Result type:', typeof result);
          console.log('InboxPilot: Result keys:', result ? Object.keys(result) : 'null');
          // Handle nested response structure: { success: true, summary: "..." } or just { summary: "..." }
          const summaryText = result?.summary || result?.data?.summary || result?.text || result?.data?.text || (typeof result === 'string' ? result : (result ? JSON.stringify(result) : ''));
          console.log('InboxPilot: Extracted summary text:', summaryText);
          console.log('InboxPilot: Summary text length:', summaryText ? summaryText.length : 0);
          if (summaryText && summaryText.trim().length > 0) {
            console.log('InboxPilot: Calling display.showResult with:', { action, textLength: summaryText.length, title: 'AI Summary' });
            this.display.showResult(action, summaryText, 'AI Summary');
            console.log('InboxPilot: display.showResult called successfully');
          } else {
            console.error('InboxPilot: No summary text found in result:', result);
            this.display.showError(action, 'No summary generated.');
          }
          break;
        case 'reply-email':
          // Open Gmail reply window and show tone selector there
          this.domHelpers.openGmailReplyWindow(() => {
            const replyWindow = document.querySelector('[role="dialog"]');
            if (replyWindow && window.replyToneSelector) {
              window.replyToneSelector.showInReplyWindow(replyWindow, emailContent.body);
            }
          });
          this.display.showLoading(action, false);
          return; // Don't show loading for reply as it opens in reply window
        case 'followup-email':
          result = await this.api.call('/ai/followup', { emailBody: emailContent.body });
          console.log('InboxPilot: Follow-up result received:', result);
          console.log('InboxPilot: Result type:', typeof result);
          console.log('InboxPilot: Result keys:', result ? Object.keys(result) : 'null');
          // Handle nested response structure: { success: true, followUp: "..." } or just { followUp: "..." }
          const followUpText = result?.followUp || result?.data?.followUp || result?.text || result?.data?.text || (typeof result === 'string' ? result : (result ? JSON.stringify(result) : ''));
          console.log('InboxPilot: Extracted follow-up text:', followUpText);
          console.log('InboxPilot: Follow-up text length:', followUpText ? followUpText.length : 0);
          if (followUpText && followUpText.trim().length > 0) {
            console.log('InboxPilot: Calling display.showResult with:', { action, textLength: followUpText.length, title: 'Follow-up Draft' });
            this.display.showResult(action, followUpText, 'Follow-up Draft');
            console.log('InboxPilot: display.showResult called successfully');
          } else {
            console.error('InboxPilot: No follow-up text found in result:', result);
            this.display.showError(action, 'No follow-up generated.');
          }
          break;
        case 'meeting-email':
          result = await this.api.call('/calendar/suggest', { emailBody: emailContent.body });
          if (result) {
            let meetingText = '';
            if (result.hasMeeting) {
              meetingText = 'Meeting detected.\n\n';
              if (result.suggestedTimes && result.suggestedTimes.length > 0) {
                meetingText += 'Suggested times:\n';
                result.suggestedTimes.forEach(slot => {
                  const start = new Date(slot.start || slot);
                  meetingText += `- ${start.toLocaleString()}\n`;
                });
              }
              if (result.attendees && result.attendees.length > 0) {
                meetingText += `\nAttendees: ${result.attendees.join(', ')}`;
              }
            } else {
              meetingText = result.message || 'No meeting request found in this email.';
            }
            this.display.showResult(action, meetingText, 'Meeting Suggestions');
          } else {
            this.display.showError(action, 'No meeting suggestions generated');
          }
          break;
        case 'explain-email':
          result = await this.api.call('/ai/rewrite', {
            text: emailContent.body,
            instruction: 'Explain this email in simple, easy-to-understand words'
          });
          const explainText = result.rewritten || result.text || (typeof result === 'string' ? result : JSON.stringify(result));
          if (explainText) {
            this.display.showResult(action, explainText, 'Simple Explanation');
          } else {
            this.display.showError(action, 'No explanation generated');
          }
          break;
      }
    } catch (error) {
      console.error('InboxPilot: Action error:', error);
      let errorMsg = error.message || 'Action failed.';
      
      // Provide helpful error messages
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = 'Cannot connect to backend server. Please ensure the backend is running at http://localhost:5000';
      } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
        errorMsg = 'Authentication failed. Please log in again.';
      } else if (errorMsg.includes('500')) {
        errorMsg = 'Server error. Please try again later.';
      }
      
      this.display.showError(action, errorMsg);
    } finally {
      this.display.showLoading(action, false);
    }
  }

  async handleReplyWithTone(emailBody, tone, replyWindow, userContext = '', token = null) {
    try {
      // Get auth token to pass user info for signature if not provided
      if (!token) {
        token = await this.api.getAuthToken();
      }
      
      // Build request with user context if provided
      const requestData = { emailBody, tone };
      if (userContext && userContext.trim()) {
        requestData.userContext = userContext.trim();
      }
      
      const result = await this.api.call('/ai/reply', requestData);
      const replies = result.replies || (result.reply ? [result.reply] : [result.text || result]);
      
      const firstReply = Array.isArray(replies) ? replies[0] : replies;
      if (firstReply) {
        // Return the reply text instead of inserting directly
        // The caller (replyToneSelector) will handle displaying it in the draft card
        return firstReply;
      } else {
        throw new Error('No reply generated');
      }
    } catch (error) {
      throw new Error('Failed to generate reply: ' + error.message);
    }
  }

  async handleComposeAction(action, composeBox) {
    // Find compose body with multiple selectors
    const composeBody = composeBox.querySelector('[contenteditable="true"][g_editable="true"]') ||
                       composeBox.querySelector('[contenteditable="true"]') ||
                       composeBox.querySelector('[role="textbox"]') ||
                       composeBox.querySelector('.Am.Al.editable');
    const currentText = composeBody?.innerText?.trim() || composeBody?.textContent?.trim() || '';

    if (!currentText && action !== 'generate') {
      // Show error in compose window if possible
      console.warn('Please write something in the compose box first');
      return;
    }

    try {
      let result;
      const selectedTone = composeBox.querySelector('.inboxpilot-tone-select')?.value || 'friendly';
      const toneLabels = {
        'formal': 'professional',
        'friendly': 'friendly',
        'assertive': 'assertive',
        'short': 'brief and concise',
        'concise': 'concise',
        'negative': 'polite but firm, expressing disagreement or concerns'
      };
      const toneLabel = toneLabels[selectedTone] || 'professional';
      
      switch (action) {
        case 'enhance':
          // Enhance the existing text with the selected tone
          if (!currentText) {
            console.warn('Please write something in the compose box first');
            return;
          }
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: `Enhance and improve this email text while maintaining a ${toneLabel} tone. Make it more polished, clear, and professional while keeping the same meaning and intent.`
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'rewrite':
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: `Rewrite this text to be clearer and more professional in a ${toneLabel} tone`
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'expand':
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: `Expand this text with more details and context in a ${toneLabel} tone`
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'shorten':
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: `Make this text shorter and more concise in a ${toneLabel} tone`
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'change-tone':
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: `Rewrite this email in a ${toneLabel} tone while keeping the same content and meaning`
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'generate':
          const subject = composeBox.querySelector('input[name="subjectbox"]')?.value || '';
          result = await this.api.call('/ai/rewrite', {
            text: `Subject: ${subject}\n\nGenerate a ${toneLabel} email about this topic`,
            instruction: `Generate a complete ${toneLabel} email`
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
      }
    } catch (error) {
      console.error('InboxPilot: Compose action error:', error);
      let errorMsg = error.message || 'Action failed.';
      if (errorMsg.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to backend. Make sure the server is running.';
      }
      this.display.showError(errorMsg);
    }
  }


  async quickReply(row) {
    const emailContent = this.extractor.extractEmailContent(row);
    if (!emailContent) return;

    try {
      const result = await this.api.call('/ai/reply', { 
        emailBody: emailContent, 
        tone: 'friendly' 
      });
      const replies = result.replies || [result];
      this.domHelpers.insertReplyIntoGmail(replies[0]);
    } catch (error) {
      console.error('Quick reply error:', error);
    }
  }

  async setPriority(row, priority) {
    const emailId = row.getAttribute('data-thread-id') || '';
    try {
      await this.api.call('/gmail/apply-label', {
        emailId,
        label: `Priority-${priority}`,
        priority
      });
      row.classList.add(`priority-${priority}`);
    } catch (error) {
      console.error('Set priority error:', error);
    }
  }
}

