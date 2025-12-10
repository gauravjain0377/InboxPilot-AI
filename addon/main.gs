/**
 * InboxPilot AI Gmail Add-on
 * Main Apps Script file
 */

function onOpen(e) {
  GmailApp.getUi()
    .createAddonMenu()
    .addItem('InboxPilot AI', 'showSidebar')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('InboxPilot AI')
    .setWidth(350);
  GmailApp.getUi().showSidebar(ui);
}

function getCurrentMessage() {
  try {
    const messageId = GmailApp.getCurrentMessageId();
    if (!messageId) return null;

    const message = GmailApp.getMessageById(messageId);
    return {
      id: message.getId(),
      subject: message.getSubject(),
      from: message.getFrom(),
      to: message.getTo(),
      body: message.getPlainBody(),
      date: message.getDate().toISOString(),
    };
  } catch (error) {
    Logger.log('Error getting message: ' + error);
    return null;
  }
}

function callBackendAPI(endpoint, data) {
  const apiUrl = 'http://localhost:5000/api' + endpoint;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('API Error: ' + error);
    return { error: error.toString() };
  }
}

function summarizeEmail(emailBody) {
  return callBackendAPI('/ai/summarize', { emailBody });
}

function generateReply(emailBody, tone) {
  return callBackendAPI('/ai/reply', { emailBody, tone: tone || 'friendly' });
}

function rewriteText(text, instruction) {
  return callBackendAPI('/ai/rewrite', { text, instruction });
}

function generateFollowUp(emailBody) {
  return callBackendAPI('/ai/followup', { emailBody });
}

function suggestMeetingTimes(emailBody) {
  return callBackendAPI('/calendar/suggest', { emailBody });
}

