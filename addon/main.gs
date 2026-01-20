/**
 * InboxPilot AI Gmail Add-on
 * Main Apps Script file
 * 
 * Update API_BASE_URL with your backend URL
 * 
 * For localhost testing:
 *   1. Use ngrok: ngrok http 5000
 *   2. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
 *   3. Update: const API_BASE_URL = 'https://abc123.ngrok.io/api';
 * 
 * For production:
 *   const API_BASE_URL = 'https://inboxpilot-ai.onrender.com/api';
 */

// Update this with your backend URL
const API_BASE_URL = 'https://inocencia-frostiest-andrew.ngrok-free.dev/api';

function showSidebar(e) {
  Logger.log("✅ Gmail Add-on triggered");

  return HtmlService.createHtmlOutputFromFile('sidebar.html')
    .setTitle('InboxPilot AI')
    .setWidth(350);
}

function getCurrentMessage() {
  Logger.log('InboxPilot: getCurrentMessage called');
  try {
    // For Gmail add-ons, getCurrentMessageId() should work with proper scopes
    const messageId = GmailApp.getCurrentMessageId();
    Logger.log('InboxPilot: Message ID = ' + messageId);
    
    if (!messageId) {
      Logger.log('InboxPilot: No message ID found - user may not have an email open');
      return { error: 'Please open an email to use this feature' };
    }

    const message = GmailApp.getMessageById(messageId);
    if (!message) {
      Logger.log('InboxPilot: Could not retrieve message');
      return { error: 'Could not retrieve email message' };
    }

    const result = {
      id: message.getId(),
      subject: message.getSubject(),
      from: message.getFrom(),
      to: message.getTo(),
      body: message.getPlainBody(),
      date: message.getDate().toISOString(),
    };
    
    Logger.log('InboxPilot: Message retrieved - Subject: ' + result.subject);
    return result;
  } catch (error) {
    Logger.log('InboxPilot: Error getting message: ' + error.toString());
    Logger.log('InboxPilot: Error details: ' + JSON.stringify(error));
    return { error: 'Error retrieving message: ' + error.toString() };
  }
}

// Get user's email to identify them for backend authentication
function getUserEmail() {
  try {
    const email = Session.getActiveUser().getEmail();
    Logger.log('InboxPilot: User email = ' + email);
    return email;
  } catch (error) {
    Logger.log('InboxPilot: Error getting user email: ' + error.toString());
    return null;
  }
}

// Call backend API with user email for authentication
function callBackendAPI(endpoint, data) {
  Logger.log('InboxPilot: callBackendAPI called - Endpoint: ' + endpoint);
  
  const userEmail = getUserEmail();
  if (!userEmail) {
    Logger.log('InboxPilot: No user email found');
    return { error: 'Could not identify user email. Please make sure you are logged into Gmail.' };
  }

  const apiUrl = API_BASE_URL + endpoint;
  Logger.log('InboxPilot: API URL = ' + apiUrl);
  Logger.log('InboxPilot: User Email = ' + userEmail);
  
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
    Logger.log('InboxPilot: Making API request...');
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('InboxPilot: Response Code = ' + responseCode);
    Logger.log('InboxPilot: Response Text = ' + responseText.substring(0, 200)); // First 200 chars
    
    if (responseCode !== 200) {
      Logger.log('InboxPilot: API Error Response: ' + responseText);
      try {
        const errorData = JSON.parse(responseText);
        return { error: errorData.message || errorData.error || 'API request failed: ' + responseCode };
      } catch (e) {
        return { error: 'API request failed: ' + responseCode + ' - ' + responseText };
      }
    }
    
    const parsed = JSON.parse(responseText);
    Logger.log('InboxPilot: API call successful');
    return parsed;
  } catch (error) {
    Logger.log('InboxPilot: API Error: ' + error.toString());
    Logger.log('InboxPilot: Error stack: ' + (error.stack || 'No stack trace'));
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

