/**
 * Email Extractor - Extracts email content from Gmail DOM
 */
class EmailExtractor {
  getCurrentEmailContent() {
    let emailBody = document.querySelector('.a3s') || 
                    document.querySelector('.ii.gt') ||
                    document.querySelector('[role="main"] .ii') ||
                    document.querySelector('[role="main"] .a3s') ||
                    document.querySelector('[role="main"]');
    
    if (!emailBody || !emailBody.textContent?.trim()) {
      const emailThread = document.querySelector('[role="main"]');
      if (emailThread) {
        const allText = emailThread.innerText || emailThread.textContent || '';
        emailBody = { innerText: allText, textContent: allText };
      }
    }
    
    const subject = document.querySelector('h2.hP')?.textContent || 
                   document.querySelector('[data-thread-perm-id] h2')?.textContent ||
                   '';
    const from = document.querySelector('.gD')?.textContent || 
                document.querySelector('[email]')?.getAttribute('email') ||
                '';

    const body = emailBody?.innerText || emailBody?.textContent || '';
    
    if (!body.trim()) {
      const mainArea = document.querySelector('[role="main"]');
      if (mainArea) {
        const visibleText = mainArea.innerText || mainArea.textContent || '';
        if (visibleText.length > 50) {
          return { subject, from, body: visibleText };
        }
      }
    }

    return { subject, from, body: body.trim() };
  }

  extractEmailContent(row) {
    const snippet = row.querySelector('span[class*="bog"]')?.textContent || '';
    return snippet;
  }

  detectLabels(subject, snippet) {
    const labels = [];
    const text = (subject + ' ' + snippet).toLowerCase();
    
    if (text.match(/\b(invoice|payment|bill|receipt|finance|financial|accounting|billing|payment due|amount|price|cost|fee)\b/)) {
      labels.push({ text: 'Finance', class: 'finance' });
    }
    
    if (text.match(/\b(urgent|asap|immediately|important|priority|high priority|critical)\b/)) {
      labels.push({ text: 'High Priority', class: 'high-priority' });
    } else if (text.match(/\b(meeting|schedule|calendar|appointment|call|conference)\b/)) {
      labels.push({ text: 'Scheduling', class: 'scheduling' });
    }
    
    return labels;
  }
}

