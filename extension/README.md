# InboxPilot AI Chrome Extension

Gmail integration extension that adds AI-powered features directly into your Gmail inbox.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension is now installed!

## Setup

1. Make sure the backend API is running on `http://localhost:5000`
2. Authenticate with your backend API to get an auth token
3. Store the token in extension storage (via popup or settings)

## Features

- **AI Sidebar Panel**: Floating panel with AI actions
- **Compose Toolbar**: AI tools in Gmail compose box
- **Email Actions**: Quick actions on email view
- **Smart Features**:
  - Summarize emails
  - Generate replies
  - Create follow-ups
  - Suggest meeting times
  - Explain emails simply
  - Rewrite/expand/shorten text

## Usage

1. Open Gmail
2. Click on any email
3. Use the InboxPilot AI panel on the right
4. Or use the toolbar in compose mode

## Development

- `manifest.json`: Extension configuration
- `contentScript.js`: Injects into Gmail pages
- `injectedUI.js`: Main UI logic and Gmail integration
- `background.js`: Service worker for extension
- `styles.css`: Styling for injected UI
- `utils/api.js`: API client for backend communication

## API Endpoints Used

- `POST /api/ai/summarize`
- `POST /api/ai/reply`
- `POST /api/ai/rewrite`
- `POST /api/ai/followup`
- `POST /api/calendar/suggest`
- `POST /api/gmail/apply-label`

