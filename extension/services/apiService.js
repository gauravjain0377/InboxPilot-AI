/**
 * API Service - Handles all backend API calls and authentication
 * Routes calls through background script to avoid CORS issues
 */
class APIService {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  async call(endpoint, data) {
    try {
      const token = await this.getAuthToken();
      
      // Route API call through background script via message passing
      // Injected scripts can't make direct fetch calls to localhost due to CORS
      return new Promise((resolve, reject) => {
        // Generate unique request ID
        const requestId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('InboxPilot: Making API call:', endpoint, 'Request ID:', requestId);
        
        // Set up response listener
        const listener = (event) => {
          // Only process messages from the same window
          if (event.source !== window) return;
          
          if (event.data.type === 'INBOXPILOT_API_RESPONSE' && event.data.requestId === requestId) {
            window.removeEventListener('message', listener);
            clearTimeout(timeoutId);
            
            if (event.data.success) {
              console.log('InboxPilot: API call succeeded:', endpoint);
              console.log('InboxPilot: Response data structure:', event.data);
              console.log('InboxPilot: Resolving with data:', event.data.data);
              resolve(event.data.data);
            } else {
              console.error('InboxPilot: API call failed:', endpoint, event.data.error);
              reject(new Error(event.data.error || 'API call failed'));
            }
          }
        };
        window.addEventListener('message', listener);
        
        // Set timeout with more helpful error message
        const timeoutId = setTimeout(() => {
          window.removeEventListener('message', listener);
          console.error('InboxPilot: API call timeout:', endpoint);
          reject(new Error(`API call timeout after 30 seconds. The request to ${this.baseURL}${endpoint} did not complete. Make sure:\n1. The backend server is running (npm run dev in the backend folder)\n2. The server is accessible at ${this.baseURL}\n3. Check the browser console and backend logs for errors`));
        }, 30000); // 30 second timeout
        
        // Send request to content script, which forwards to background
        try {
          window.postMessage({
            type: 'INBOXPILOT_API_CALL',
            requestId,
            endpoint,
            data,
            token
          }, '*');
          console.log('InboxPilot: API call message sent to content script');
        } catch (error) {
          clearTimeout(timeoutId);
          window.removeEventListener('message', listener);
          console.error('InboxPilot: Error posting message:', error);
          reject(new Error('Failed to send API request: ' + error.message));
        }
      });
    } catch (error) {
      console.error('InboxPilot: API call error:', error);
      throw error;
    }
  }

  async getAuthToken() {
    return new Promise((resolve) => {
      try {
        const token = localStorage.getItem('inboxpilot_authToken');
        if (token) {
          resolve(token);
          return;
        }
        
        window.postMessage({ type: 'INBOXPILOT_GET_TOKEN' }, '*');
        
        const listener = (event) => {
          if (event.data.type === 'INBOXPILOT_TOKEN_RESPONSE') {
            window.removeEventListener('message', listener);
            resolve(event.data.token || null);
          }
        };
        window.addEventListener('message', listener);
        
        setTimeout(() => {
          window.removeEventListener('message', listener);
          resolve(null);
        }, 500);
      } catch (error) {
        console.error('InboxPilot: Error getting auth token:', error);
        resolve(null);
      }
    });
  }
}

