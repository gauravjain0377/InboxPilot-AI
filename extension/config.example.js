/**
 * Configuration file for InboxPilot Extension
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to config.js
 * 2. Update API_BASE_URL with your production backend URL
 * 3. Update this file in background.js and apiService.js to use config.js
 */

// Production API URL - Replace with your deployed backend URL
const API_BASE_URL = 'https://your-backend-api.com/api';

// Development API URL (for local testing)
// const API_BASE_URL = 'http://localhost:5000/api';

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_BASE_URL };
}

