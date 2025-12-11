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

    const addLabel = (textLabel, cssClass) => {
      if (!labels.find(l => l.class === cssClass)) {
        labels.push({ text: textLabel, class: cssClass });
      }
    };

    // 1) Category-style labels (roughly 20+ possible types)
    if (/(invoice|payment|bill|receipt|statement|balance|emi|sip|mutual fund|brokerage|gst|tax)/.test(text) ||
        /(groww|zerodha|upstox|hdfc|icici|sbi|axis bank|bank of)/.test(text)) {
      addLabel('Finance', 'finance');
    }

    if (/(meeting|schedule|calendar|appointment|invite|zoom|google meet|teams call|reschedule)/.test(text)) {
      addLabel('Scheduling', 'scheduling');
    }

    if (/(newsletter|digest|roundup|weekly update|product update|changelog)/.test(text)) {
      addLabel('Newsletter', 'newsletter');
    }

    if (/(offer|sale|discount|deal|coupon|promo|promotion|black friday|cyber monday)/.test(text)) {
      addLabel('Promo', 'promo');
    }

    if (/(marketing|campaign|leads|growth|crm|mailchimp|hubspot)/.test(text)) {
      addLabel('Marketing', 'marketing');
    }

    if (/(linkedin|twitter|x\.com|facebook|instagram|youtube|github|slack|discord|community)/.test(text)) {
      addLabel('Social', 'social');
    }

    if (/(google cloud|aws|azure|gcp|kubernetes|docker|devops|api key|token|error log)/.test(text)) {
      addLabel('Dev & Tools', 'devtools');
    }

    if (/(flight|hotel|boarding pass|check-in|itinerary|air india|make my trip|booking\.com|ola|uber)/.test(text)) {
      addLabel('Travel', 'travel');
    }

    if (/(order|delivery|shipped|tracking number|invoice for your order|amazon|flipkart)/.test(text)) {
      addLabel('Orders', 'orders');
    }

    if (/(job|hiring|recruiter|interview|application|career|opening)/.test(text)) {
      addLabel('Jobs', 'jobs');
    }

    if (/(webinar|workshop|summit|conference|meetup|event)/.test(text)) {
      addLabel('Events', 'events');
    }

    if (/(course|class|lesson|tutorial|academy|learning|university|college)/.test(text)) {
      addLabel('Education', 'education');
    }

    if (/(subscription|plan|renewal|auto-debit|trial expiring|expires on)/.test(text)) {
      addLabel('Subscription', 'subscription');
    }

    if (/(security alert|suspicious|unusual activity|password reset|otp|verification code)/.test(text)) {
      addLabel('Security', 'security');
    }

    if (/(feedback|survey|rate us|review)/.test(text)) {
      addLabel('Feedback', 'feedback');
    }

    if (/(welcome|thanks for signing up|getting started)/.test(text)) {
      addLabel('Onboarding', 'onboarding');
    }

    if (/(newsletter|digest)/.test(text)) {
      addLabel('Updates', 'updates');
    }

    // 2) Priority heuristics (always assign at least one)
    if (/(urgent|asap|immediately|important|high priority|critical|action required|respond today)/.test(text)) {
      addLabel('High Priority', 'high-priority');
    } else if (/(reminder|follow up|follow-up|nudge|pending)/.test(text)) {
      addLabel('Medium Priority', 'medium-priority');
    } else if (/(newsletter|digest|roundup|summary|update)/.test(text)) {
      addLabel('Low Priority', 'low-priority');
    }

    // 3) Reply needed
    if (text.includes('?') || /(rsvp|please reply|please respond|let us know|confirm your attendance)/.test(text)) {
      addLabel('Reply Needed', 'reply-needed');
    }

    // 4) Fallback – ensure every email gets at least one label
    if (labels.length === 0) {
      addLabel('General', 'general');
    }

    return labels;
  }
}

