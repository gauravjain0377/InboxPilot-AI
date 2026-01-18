/**
 * InboxPilot AI Gmail Add-on
 * Main Apps Script file
 * 
 * Update API_BASE_URL with your production backend URL after deployment
 */

// Update this with your production backend URL (e.g., https://your-backend.onrender.com/api)
const API_BASE_URL = 'https://your-backend.onrender.com/api';

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

// Get user's email to identify them for backend authentication
function getUserEmail() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (error) {
    Logger.log('Error getting user email: ' + error);
    return null;
  }
}

// Call backend API with user email for authentication
function callBackendAPI(endpoint, data) {
  const userEmail = getUserEmail();
  if (!userEmail) {
    return { error: 'Could not identify user email. Please make sure you are logged into Gmail.' };
  }

  const apiUrl = API_BASE_URL + endpoint;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify({
      ...data,
      userEmail: userEmail, // Send user email to identify them
    }),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      Logger.log('API Error Response: ' + responseText);
      const errorData = JSON.parse(responseText);
      return { error: errorData.message || errorData.error || 'API request failed: ' + responseCode };
    }
    
    return JSON.parse(responseText);
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

