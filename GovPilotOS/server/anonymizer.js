class DataAnonymizer {
  static sanitize(input) {
    if (input === null || input === undefined) return input;
    if (typeof input === 'string') return this.maskText(input);
    if (Array.isArray(input)) return input.map((item) => this.sanitize(item));
    if (typeof input === 'object') {
      if (input instanceof Date) return input;
      return Object.fromEntries(
        Object.entries(input).map(([key, value]) => [key, this.sanitize(value)])
      );
    }
    return input;
  }

  static maskText(value) {
    let text = String(value);

    const patterns = [
      {
        regex: /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:Pvt|Private|Limited|Ltd|LLP|Technologies|Systems|Solutions|Digital|Labs|Health|Analytics|Informatics|Infra|AI|Mobility|Materials|Research|Works|Ventures)\b/g,
        replacement: '[COMPANY_MASKED]',
      },
      {
        regex: /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Pvt|Private|Limited|Ltd|LLP)\b/g,
        replacement: '[COMPANY_MASKED]',
      },
      {
        regex: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g,
        replacement: '[OFFICER_MASKED]',
      },
      {
        regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
        replacement: '[EMAIL_MASKED]',
      },
      {
        regex: /(\+?\d{1,3}[-\s]?)?(?:\(?\d{2,4}\)?[-\s]?){2,4}\d{3,4}/g,
        replacement: '[PHONE_MASKED]',
      },
      {
        regex: /(?:₹|INR|Rs\.?|rupees?)\s*[-: ]?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:lakh|lac|lacs|crore|crores|cr|lakhs|rs|rupees)?/gi,
        replacement: '[AMOUNT_MASKED]',
      },
      {
        regex: /\b(?:DIPP|DIN|CIN|GSTIN|PAN|Udyam|Aadhaar|IFSC|ACCOUNT|BANK)\s?[A-Z0-9-]+\b/gi,
        replacement: '[IDENTITY_MASKED]',
      },
      {
        regex: /\b(?:[A-Z][a-z]+\s+){1,3}(?:Inc|Inc\.|Incorporated|LLC|LLP|Pvt|Private|Limited|Ltd)\b/g,
        replacement: '[COMPANY_MASKED]',
      },
    ];

    for (const { regex, replacement } of patterns) {
      text = text.replace(regex, replacement);
    }

    text = text
      .replace(/\b(?:Mr|Ms|Mrs|Dr|Prof|Officer|Director|Ceo|Cto|Founder|Head|Manager|Lead)\s+[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+)*/gi, '[OFFICER_MASKED]')
      .replace(/(?:\b[A-Z][a-z]+\s+){2,}(?:of|the|and)\b/gi, '[OFFICER_MASKED]')
      .replace(/\[OFFICER_MASKED\]\s+\[OFFICER_MASKED\]/g, '[OFFICER_MASKED]');

    return text.trim();
  }
}

module.exports = { DataAnonymizer };
