const API_BASE_URL = 'http://localhost:5000/api';

class InboxPilotAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getToken() {
    const result = await chrome.storage.local.get(['authToken']);
    return result.authToken;
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async summarizeEmail(emailBody) {
    return this.request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ emailBody }),
    });
  }

  async generateReply(emailBody, tone = 'friendly') {
    return this.request('/ai/reply', {
      method: 'POST',
      body: JSON.stringify({ emailBody, tone }),
    });
  }

  async rewriteText(text, instruction) {
    return this.request('/ai/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text, instruction }),
    });
  }

  async generateFollowUp(emailBody) {
    return this.request('/ai/followup', {
      method: 'POST',
      body: JSON.stringify({ emailBody }),
    });
  }

  async suggestMeetingTimes(emailBody) {
    return this.request('/calendar/suggest', {
      method: 'POST',
      body: JSON.stringify({ emailBody }),
    });
  }

  async applyLabel(emailId, label) {
    return this.request('/gmail/apply-label', {
      method: 'POST',
      body: JSON.stringify({ emailId, label }),
    });
  }
}

const api = new InboxPilotAPI();
export default api;

