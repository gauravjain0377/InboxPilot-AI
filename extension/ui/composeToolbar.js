/**
 * Compose Toolbar Component - Creates AI assistant toolbar in compose window
 */
class ComposeToolbar {
  constructor(actionHandler) {
    this.actionHandler = actionHandler;
    this.observer = null;
  }

  inject() {
    this.observer = new MutationObserver(() => {
      const composeBox = document.querySelector('[role="dialog"]');
      if (composeBox && !composeBox.querySelector('.inboxpilot-compose-toolbar')) {
        this.create(composeBox);
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  create(composeBox) {
    const toolbar = document.createElement('div');
    toolbar.className = 'inboxpilot-compose-toolbar';
    
    const content = document.createElement('div');
    content.className = 'inboxpilot-toolbar-content';
    
    const label = document.createElement('span');
    label.className = 'inboxpilot-label';
    label.textContent = '✨ AI Assistant';
    
    const buttons = document.createElement('div');
    buttons.className = 'inboxpilot-toolbar-buttons';
    
    const select = document.createElement('select');
    select.className = 'inboxpilot-tone-select';
    ['formal', 'friendly', 'assertive', 'short'].forEach(val => {
      const option = document.createElement('option');
      option.value = val;
      option.textContent = val.charAt(0).toUpperCase() + val.slice(1);
      if (val === 'friendly') option.selected = true;
      select.appendChild(option);
    });
    buttons.appendChild(select);
    
    const toolbarActions = [
      { action: 'rewrite', icon: '✏️', text: 'Rewrite', title: 'Rewrite' },
      { action: 'expand', icon: '📝', text: 'Expand', title: 'Expand' },
      { action: 'shorten', icon: '✂️', text: 'Shorten', title: 'Shorten' },
      { action: 'change-tone', icon: '🎨', text: 'Tone', title: 'Change Tone' },
      { action: 'generate', icon: '✨', text: 'Generate', title: 'Generate Email', primary: true }
    ];
    
    toolbarActions.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'inboxpilot-toolbar-btn' + (item.primary ? ' primary' : '');
      btn.setAttribute('data-action', item.action);
      btn.setAttribute('title', item.title);
      const span = document.createElement('span');
      span.textContent = item.icon + ' ' + item.text;
      btn.appendChild(span);
      buttons.appendChild(btn);
    });
    
    content.appendChild(label);
    content.appendChild(buttons);
    toolbar.appendChild(content);

    const composeBody = composeBox.querySelector('[contenteditable="true"]')?.parentElement ||
                        composeBox.querySelector('.Am') ||
                        composeBox.querySelector('[role="textbox"]')?.parentElement ||
                        composeBox.querySelector('.aO');
    
    if (composeBody) {
      if (!composeBody.querySelector('.inboxpilot-compose-toolbar')) {
        composeBody.insertBefore(toolbar, composeBody.firstChild);
      }
    } else {
      composeBox.insertBefore(toolbar, composeBox.firstChild);
    }

    toolbar.querySelectorAll('.inboxpilot-toolbar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.inboxpilot-toolbar-btn');
        if (actionBtn && actionBtn.dataset.action) {
          this.actionHandler(actionBtn.dataset.action, composeBox);
        }
      });
    });
  }
}

