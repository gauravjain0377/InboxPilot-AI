import { IRule } from '../models/Preferences.js';
import { IEmail } from '../models/Email.js';

export class RuleEngine {
  evaluateRules(rules: IRule[], email: Partial<IEmail>): {
    label?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
  } {
    const activeRules = rules.filter((rule) => rule.isActive);

    for (const rule of activeRules) {
      if (this.matchesRule(rule, email)) {
        return rule.actions;
      }
    }

    return {};
  }

  private matchesRule(rule: IRule, email: Partial<IEmail>): boolean {
    return rule.conditions.every((condition) => {
      const fieldValue = this.getFieldValue(email, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  private getFieldValue(email: Partial<IEmail>, field: string): string {
    switch (field) {
      case 'subject':
        return email.subject?.toLowerCase() || '';
      case 'body':
        return email.body?.toLowerCase() || '';
      case 'from':
        return email.from?.toLowerCase() || '';
      case 'to':
        return email.to?.join(' ').toLowerCase() || '';
      default:
        return '';
    }
  }

  private evaluateCondition(value: string, operator: string, expected: string): boolean {
    const lowerExpected = expected.toLowerCase();

    switch (operator) {
      case 'contains':
        return value.includes(lowerExpected);
      case 'equals':
        return value === lowerExpected;
      case 'startsWith':
        return value.startsWith(lowerExpected);
      case 'endsWith':
        return value.endsWith(lowerExpected);
      default:
        return false;
    }
  }
}

