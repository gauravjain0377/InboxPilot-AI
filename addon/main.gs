const DEFAULT_API_BASE_URL = 'https://inboxpilot-ai.onrender.com/api';

function getApiBaseUrl_() {
  try {
    const props = PropertiesService.getScriptProperties();
    const configured = (props.getProperty('API_BASE_URL') || '').trim();
    return configured || DEFAULT_API_BASE_URL;
  } catch (e) {
    return DEFAULT_API_BASE_URL;
  }
}

// Optional helper: set from Apps Script editor for quick switching.
function setApiBaseUrl(baseUrl) {
  PropertiesService.getScriptProperties().setProperty('API_BASE_URL', String(baseUrl || '').trim());
  return { success: true, API_BASE_URL: getApiBaseUrl_() };
}

// Quick switch to localhost (for development)
function setLocalhost() {
  const result = setApiBaseUrl('http://localhost:5000/api');
  Logger.log('✅ Switched to LOCALHOST: ' + result.API_BASE_URL);
  return result;
}

// Quick switch to production (Render)
function setProduction() {
  const result = setApiBaseUrl('https://inboxpilot-ai.onrender.com/api');
  Logger.log('✅ Switched to PRODUCTION: ' + result.API_BASE_URL);
  return result;
}

// Check current API URL
function checkCurrentApiUrl() {
  const url = getApiBaseUrl_();
  Logger.log('📍 Current API URL: ' + url);
  return { currentUrl: url, isLocalhost: url.includes('localhost'), isProduction: url.includes('onrender.com') };
}

function showSidebar(e) {
  Logger.log("✅ Gmail Add-on triggered");
  Logger.log("Event: " + JSON.stringify(e || {}));

  return HtmlService.createHtmlOutputFromFile('sidebar.html')
    .setTitle('InboxPilot AI')
    .setWidth(350);
}

// Force authorization - run this in Apps Script to authorize the add-on
function forceAuthorize() {
  try {
    Logger.log('🔐 Forcing authorization...');
    
    // Try to get user email - this forces authorization
    const email = Session.getActiveUser().getEmail();
    Logger.log('✅ User email retrieved: ' + email);
    
    // Try to access Gmail - this forces Gmail API authorization
    const threads = GmailApp.getInboxThreads(0, 1);
    Logger.log('✅ Gmail access works! Found ' + threads.length + ' thread(s)');
    
    // Try to get current message ID if available
    try {
      const messageId = GmailApp.getCurrentMessageId();
      Logger.log('✅ Current message ID: ' + messageId);
    } catch (e) {
      Logger.log('ℹ️ No current message (this is OK if no email is open)');
    }
    
    Logger.log('✅ Authorization successful! The add-on should now appear in Gmail.');
    return {
      success: true,
      message: 'Authorization successful! Open an email in Gmail and the add-on should appear.',
      userEmail: email
    };
  } catch (error) {
    Logger.log('❌ Authorization error: ' + error.toString());
    return {
      success: false,
      error: error.toString(),
      message: 'Please authorize the script when prompted.'
    };
  }
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

  const apiUrl = getApiBaseUrl_() + endpoint;
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
    Logger.log('InboxPilot: Response Text = ' + responseText.substring(0, 500)); // First 500 chars
    
    if (responseCode !== 200) {
      Logger.log('InboxPilot: API Error Response: ' + responseText);
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || errorData.error || 'API request failed: ' + responseCode;
        
        // Provide more helpful error messages
        if (responseCode === 401 || responseCode === 403) {
          return { error: 'Authentication error. Please check your OAuth configuration and ensure the backend API is properly configured.' };
        } else if (responseCode === 404) {
          return { error: 'API endpoint not found. Please check the API_BASE_URL configuration.' };
        } else if (responseCode === 500) {
          return { error: 'Server error: ' + errorMessage + '. Please check backend logs for details.' };
        } else if (responseCode === 0 || responseCode >= 500) {
          return { error: 'Cannot connect to server. Please ensure the backend API is running at: ' + apiUrl };
        }
        
        return { error: errorMessage };
      } catch (e) {
        // If response is not JSON, return raw error
        const errorMsg = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText;
        return { error: 'API request failed (' + responseCode + '): ' + errorMsg };
      }
    }
    
    const parsed = JSON.parse(responseText);
    Logger.log('InboxPilot: API call successful');
    return parsed;
  } catch (error) {
    Logger.log('InboxPilot: API Error: ' + error.toString());
    Logger.log('InboxPilot: Error stack: ' + (error.stack || 'No stack trace'));
    
    // Provide more helpful error messages
    const errorStr = error.toString();
    if (errorStr.includes('UrlFetchApp') || errorStr.includes('fetch')) {
      return { error: 'Cannot connect to backend API. Please check:\n1. Backend API is running\n2. API_BASE_URL is correct\n3. Network connectivity\n\nCurrent API URL: ' + apiUrl };
    }
    
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

// Helper function to test API connection (can be called from sidebar for debugging)
function testAPIConnection() {
  Logger.log('InboxPilot: Testing API connection...');
  const apiUrl = getApiBaseUrl_();
  Logger.log('InboxPilot: API Base URL = ' + apiUrl);
  
  try {
    const response = UrlFetchApp.fetch(apiUrl + '/ai/verify-key', {
      method: 'GET',
      muteHttpExceptions: true,
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('InboxPilot: Test Response Code = ' + responseCode);
    Logger.log('InboxPilot: Test Response = ' + responseText);
    
    return {
      success: responseCode === 200,
      statusCode: responseCode,
      message: responseCode === 200 ? 'API connection successful' : 'API connection failed: ' + responseText,
      apiUrl: apiUrl,
    };
  } catch (error) {
    Logger.log('InboxPilot: Test API Error: ' + error.toString());
    return {
      success: false,
      message: 'Cannot connect to API: ' + error.toString(),
      apiUrl: apiUrl,
    };
  }
}

