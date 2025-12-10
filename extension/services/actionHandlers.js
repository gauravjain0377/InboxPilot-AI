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

  async handleAction(action, sidebar) {
    const emailContent = this.extractor.getCurrentEmailContent();
    if (!emailContent.body || emailContent.body.trim().length === 0) {
      this.display.showError('No email content found. Please open an email first.');
      return;
    }

    sidebar.showLoading(true);
    sidebar.clearResults();

    try {
      let result;
      switch (action) {
        case 'summarize':
          result = await this.api.call('/ai/summarize', { emailBody: emailContent.body });
          const summaryText = result?.summary || result?.text || (typeof result === 'string' ? result : (result ? JSON.stringify(result) : ''));
          if (summaryText && summaryText.trim().length > 0) {
            this.display.showResult(summaryText, 'AI Summary');
          } else {
            this.display.showError('No summary generated. Response: ' + JSON.stringify(result));
          }
          break;
        case 'reply':
          this.domHelpers.openGmailReplyWindow(() => {
            this.display.showToneSelector((selectedTone) => {
              this.handleReplyWithTone(emailContent.body, selectedTone);
            });
          });
          break;
        case 'followup':
          result = await this.api.call('/ai/followup', { emailBody: emailContent.body });
          const followUpText = result?.followUp || result?.text || (typeof result === 'string' ? result : (result ? JSON.stringify(result) : ''));
          if (followUpText && followUpText.trim().length > 0) {
            this.display.showResult(followUpText, 'Follow-up Draft');
          } else {
            this.display.showError('No follow-up generated. Response: ' + JSON.stringify(result));
          }
          break;
        case 'meeting':
          result = await this.api.call('/calendar/suggest', { emailBody: emailContent.body });
          if (result) {
            this.display.showMeetingSuggestions(result);
          } else {
            this.display.showError('No meeting suggestions generated');
          }
          break;
        case 'explain':
          result = await this.api.call('/ai/rewrite', {
            text: emailContent.body,
            instruction: 'Explain this email in simple, easy-to-understand words'
          });
          const explainText = result.rewritten || result.text || (typeof result === 'string' ? result : JSON.stringify(result));
          if (explainText) {
            this.display.showResult(explainText, 'Simple Explanation');
          } else {
            this.display.showError('No explanation generated');
          }
          break;
      }
    } catch (error) {
      console.error('InboxPilot: Action error:', error);
      const errorMsg = error.message || 'Action failed. Check if backend is running at http://localhost:5000';
      this.display.showError(errorMsg);
    } finally {
      sidebar.showLoading(false);
    }
  }

  async handleComposeAction(action, composeBox) {
    const composeBody = composeBox.querySelector('[contenteditable="true"]');
    const currentText = composeBody?.innerText || '';

    if (!currentText && action !== 'generate') {
      this.display.showError('Please write something first');
      return;
    }

    try {
      let result;
      switch (action) {
        case 'rewrite':
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: 'Rewrite this text to be clearer and more professional'
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'expand':
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: 'Expand this text with more details and context'
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'shorten':
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: 'Make this text shorter and more concise'
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'change-tone':
          const tone = composeBox.querySelector('.inboxpilot-tone-select')?.value || 'friendly';
          result = await this.api.call('/ai/rewrite', {
            text: currentText,
            instruction: `Rewrite this in a ${tone} tone`
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
        case 'generate':
          const subject = composeBox.querySelector('input[name="subjectbox"]')?.value || '';
          result = await this.api.call('/ai/rewrite', {
            text: `Subject: ${subject}\n\nGenerate a professional email about this topic`,
            instruction: 'Generate a complete professional email'
          });
          this.domHelpers.insertIntoCompose(composeBody, result.rewritten || result);
          break;
      }
    } catch (error) {
      this.display.showError(error.message);
    }
  }

  async handleReplyWithTone(emailBody, tone) {
    try {
      const result = await this.api.call('/ai/reply', { emailBody, tone });
      const toneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);
      const replies = result.replies || (result.reply ? [result.reply] : [result.text || result]);
      
      const firstReply = Array.isArray(replies) ? replies[0] : replies;
      if (firstReply) {
        this.domHelpers.insertReplyIntoGmail(firstReply);
        this.display.showReplies(replies, toneLabel);
      } else {
        this.display.showError('No reply generated');
      }
    } catch (error) {
      this.display.showError('Failed to generate reply: ' + error.message);
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
      this.display.showError('Failed to generate reply');
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
      this.display.showSuccess(`Priority set to ${priority}`);
    } catch (error) {
      this.display.showError('Failed to set priority');
    }
  }
}

