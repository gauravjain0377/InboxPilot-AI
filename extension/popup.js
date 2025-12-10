document.getElementById('openGmail').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://mail.google.com' });
});

document.getElementById('settings').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000/settings' });
});

