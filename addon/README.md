# InboxPilot AI Gmail Add-on

Google Apps Script add-on that adds InboxPilot AI features as a sidebar in Gmail.

## Installation

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Copy the contents of `main.gs` into `Code.gs`
4. Create an HTML file named `sidebar.html` and paste the contents
5. Update `appsscript.json` with the provided configuration
6. Deploy as a Gmail add-on

## Setup

1. Configure OAuth scopes in Google Cloud Console
2. Set up backend API URL in the script
3. Deploy the add-on

## Features

- Sidebar panel in Gmail
- AI-powered email summarization
- Reply generation
- Follow-up suggestions
- Meeting time suggestions
- Simple explanations

## API Integration

The add-on calls your backend API at `http://localhost:5000/api` for AI features.

## Deployment

1. Click "Deploy" > "New deployment"
2. Select type: "Gmail add-on"
3. Configure permissions
4. Install in your Gmail account

