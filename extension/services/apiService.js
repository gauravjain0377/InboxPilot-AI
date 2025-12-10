/**
 * API Service - Handles all backend API calls and authentication
 */
class APIService {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  async call(endpoint, data) {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }).catch((fetchError) => {
        console.error('InboxPilot: Fetch error:', fetchError);
        throw new Error(`Cannot connect to backend. Make sure the server is running at ${this.baseURL}`);
      });

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json().catch(() => {
        throw new Error('Invalid response from server');
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

