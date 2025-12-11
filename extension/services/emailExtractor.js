/**
 * Email Extractor - Extracts email content from Gmail DOM
 */
class EmailExtractor {
  getCurrentEmailContent() {
    // Try multiple selectors for email body
    let emailBody = document.querySelector('.a3s') || 
                    document.querySelector('.ii.gt') ||
                    document.querySelector('[role="main"] .ii') ||
                    document.querySelector('[role="main"] .a3s') ||
                    document.querySelector('[role="main"] .adn') ||
                    document.querySelector('[role="main"] .a3s.aiL') ||
                    document.querySelector('[role="main"]');
    
    // If no body found, try to get from thread view
    if (!emailBody || !emailBody.textContent?.trim()) {
      const emailThread = document.querySelector('[role="main"]');
      if (emailThread) {
        // Try to get the actual email content, not the whole thread
        const emailContent = emailThread.querySelector('[dir="ltr"]') ||
                           emailThread.querySelector('.ii') ||
                           emailThread;
        const allText = emailContent.innerText || emailContent.textContent || '';
        if (allText.trim().length > 20) {
          emailBody = { innerText: allText, textContent: allText };
        }
      }
    }
    
    // Try multiple selectors for subject
    const subject = document.querySelector('h2.hP')?.textContent?.trim() || 
                   document.querySelector('[data-thread-perm-id] h2')?.textContent?.trim() ||
                   document.querySelector('h2[data-thread-id]')?.textContent?.trim() ||
                   document.querySelector('.hP')?.textContent?.trim() ||
                   '';
    
    // Try multiple selectors for sender
    const from = document.querySelector('.gD')?.textContent?.trim() || 
                document.querySelector('[email]')?.getAttribute('email')?.trim() ||
                document.querySelector('.go')?.textContent?.trim() ||
                document.querySelector('.g2')?.textContent?.trim() ||
                '';

    const body = emailBody?.innerText?.trim() || emailBody?.textContent?.trim() || '';
    
    // If still no body, try to extract from main area
    if (!body || body.length < 20) {
      const mainArea = document.querySelector('[role="main"]');
      if (mainArea) {
        // Exclude navigation and UI elements
        const excludedSelectors = ['nav', 'header', '.inboxpilot-', 'button', '[role="button"]'];
        let visibleText = '';
        
        // Get text from specific email content areas
        const contentAreas = mainArea.querySelectorAll('.a3s, .ii, [dir="ltr"]');
        if (contentAreas.length > 0) {
          contentAreas.forEach(area => {
            const text = area.innerText || area.textContent || '';
            if (text.length > visibleText.length) {
              visibleText = text;
            }
          });
        } else {
          visibleText = mainArea.innerText || mainArea.textContent || '';
        }
        
        if (visibleText.length > 50) {
          return { subject, from, body: visibleText.trim() };
        }
      }
    }

    return { subject, from, body: body.trim() };
  }

  extractEmailContent(row) {
    const subject = row.querySelector('span[class*="bog"]')?.textContent || '';
    const snippet = row.querySelector('span[class*="y2"]')?.textContent || '';
    return `${subject} ${snippet}`.trim();
  }

  /**
   * Lightweight heuristic classifier for inbox rows.
   * Returns an array of label objects: { text: string, class: string }
   */
  detectLabels(subject, snippet, from = '') {
    const labels = [];
    const text = (subject + ' ' + snippet + ' ' + from).toLowerCase();

    // Finance / billing
    if (text.match(/\b(invoice|payment|bill|receipt|finance|financial|accounting|billing|payment due|amount|price|cost|fee|tax)\b/)) {
      labels.push({ text: 'Finance', class: 'finance' });
    }

    // Scheduling / meetings
    if (text.match(/\b(meeting|schedule|calendar|appointment|call|conference|reschedule|zoom|google meet|teams)\b/)) {
      labels.push({ text: 'Scheduling', class: 'scheduling' });
    }

    // Marketing / newsletters / promotions
    if (text.match(/\b(marketing|newsletter|campaign|promo|promotion|offer|sale|discount|webinar|update from our team)\b/)) {
      labels.push({ text: 'Marketing', class: 'marketing' });
    }

    // Social / community platforms (based mainly on sender/domain keywords)
    if (text.match(/\b(linkedin|twitter|x\.com|facebook|instagram|youtube|github|community|slack|discord)\b/)) {
      labels.push({ text: 'Social', class: 'social' });
    }

    // Priority heuristics
    if (text.match(/\b(urgent|asap|immediately|important|priority|high priority|critical|action required|respond today)\b/)) {
      labels.push({ text: 'High Priority', class: 'high-priority' });
    } else if (text.match(/\b(reminder|follow up|follow-up|nudge|update)\b/)) {
      labels.push({ text: 'Medium Priority', class: 'medium-priority' });
    } else if (text.match(/\b(newsletter|digest|roundup|summary|update)\b/)) {
      labels.push({ text: 'Low Priority', class: 'low-priority' });
    }

    // Reply needed
    if (text.includes('?') || text.match(/\b(rsvp|please reply|please respond|let us know|confirm your attendance)\b/)) {
      labels.push({ text: 'Reply Needed', class: 'reply-needed' });
    }

    return labels;
  }
}

