export interface RawTransaction {
  date: string;
  description: string;
  amount: string;
  type: string;
  account: string;
  raw: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  account: string;
  raw: string;
  category: string;
  categoryEmoji: string;
  manual?: boolean;
}

function normalizeDate(d: string): string {
  if (!d) return '';
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // RFC 2822: "Sun, 17 May 2026 01:36:13 -0400 (EDT)"
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return d;
}

function parseAmount(raw: string, amountStr: string): number {
  if (amountStr && amountStr.trim() !== '') {
    const cleaned = amountStr.replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    if (!isNaN(n)) return n;
  }
  // Match "autorisation de X $" and "opération de X $"
  const match = raw.match(/(?:autorisation|op[eé]ration) de\s+([\d\s,]+[\d])\s*\$/i);
  if (match) {
    const cleaned = match[1].replace(/\s/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

function parseDescription(raw: string, description: string): string {
  if (description && description.trim() !== '') return description.trim();
  // Match merchant before "a été" or before time "à HH h"
  const match = raw.match(/aupr[eèê]s de (.+?)(?:\s+a [eèê]t[eèê]|\s+à \d)/i);
  if (match) return match[1].trim();
  const match2 = raw.match(/aupr[eèê]s de ([^,.\n]+)/i);
  if (match2) return match2[1].trim();
  return 'Transaction';
}

const CATEGORY_MAP: { pattern: RegExp; emoji: string; category: string }[] = [
  { pattern: /cafe|café|coffee|restaurant|resto|boulang|bistro|pizza|sushi|burger|food|eat|dine|ritual/i, emoji: '🍽', category: 'Restauration' },
  { pattern: /uber|lyft|taxi|transit|transport|bus|metro|gas|essence|shell|petro|esso|parking/i, emoji: '🚗', category: 'Transport' },
  { pattern: /maxi|metro|iga|costco|walmart|grocery|épicerie|supermarché|loblaws|provigo/i, emoji: '🛒', category: 'Épicerie' },
  { pattern: /amazon|shop|boutique|zara|h&m|uniqlo|sport|canadian tire|ikea|best buy/i, emoji: '🛍', category: 'Shopping' },
  { pattern: /netflix|spotify|apple|google play|disney|prime|subscription|abonnement|adobe/i, emoji: '📺', category: 'Abonnements' },
  { pattern: /hydro|bell|rogers|videotron|internet|phone|téléphone|electricit|gaz|utility/i, emoji: '⚡', category: 'Utilités' },
  { pattern: /transfer|virement|e-transfer|interac/i, emoji: '💸', category: 'Transferts' },
  { pattern: /atm|guichet|withdrawal|retrait/i, emoji: '🏧', category: 'Retrait' },
  { pattern: /pharmacy|pharmacie|jean coutu|pharmaprix|shoppers|drug/i, emoji: '💊', category: 'Pharmacie' },
];

function categorize(description: string): { emoji: string; category: string } {
  for (const { pattern, emoji, category } of CATEGORY_MAP) {
    if (pattern.test(description)) return { emoji, category };
  }
  return { emoji: '💳', category: 'Autre' };
}

export function parseTransactions(rows: RawTransaction[]): Transaction[] {
  return rows
    .filter(r => r.date && r.date.trim() !== '')
    .map((r, i) => {
      const date = normalizeDate(r.date);
      const description = parseDescription(r.raw, r.description);
      const amount = parseAmount(r.raw, r.amount);
      const type: 'debit' | 'credit' = (r.type?.toLowerCase() === 'credit') ? 'credit' : 'debit';
      const { emoji, category } = categorize(description);
      return {
        id: `${date}-${i}`,
        date,
        description,
        amount,
        type,
        account: r.account || '',
        raw: r.raw || '',
        category,
        categoryEmoji: emoji,
      };
    })
    .filter(t => t.amount > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}
