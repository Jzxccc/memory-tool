// Parses search queries with boolean operators.
// Supports: | (OR), & (AND), bare terms default to AND.

import type { ParsedQuery, QueryOperator } from '../../types/search-types.js';

export function parseQuery(query: string): ParsedQuery {
  const trimmed = query.trim();

  // Detect OR operator
  if (trimmed.includes('|') && !trimmed.includes('&')) {
    const terms = trimmed
      .split('|')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    return { terms, operator: 'OR' };
  }

  // Detect AND operator
  if (trimmed.includes('&')) {
    const terms = trimmed
      .split('&')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    return { terms, operator: 'AND' };
  }

  // Default: split by whitespace, AND semantics
  const terms = trimmed
    .split(/\s+/)
    .filter(t => t.length > 0);

  return {
    terms,
    operator: terms.length > 1 ? 'AND' : 'AND',
  };
}
