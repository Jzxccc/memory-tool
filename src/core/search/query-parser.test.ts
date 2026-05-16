import { describe, it, expect } from 'vitest';
import { parseQuery } from './query-parser.js';

describe('parseQuery', () => {
  it('parses bare terms as AND', () => {
    const result = parseQuery('jwt refresh token');
    expect(result.terms).toEqual(['jwt', 'refresh', 'token']);
    expect(result.operator).toBe('AND');
  });

  it('parses | as OR', () => {
    const result = parseQuery('jwt | oauth | session');
    expect(result.terms).toEqual(['jwt', 'oauth', 'session']);
    expect(result.operator).toBe('OR');
  });

  it('parses & as AND', () => {
    const result = parseQuery('jwt & refresh & token');
    expect(result.terms).toEqual(['jwt', 'refresh', 'token']);
    expect(result.operator).toBe('AND');
  });

  it('parses single term', () => {
    const result = parseQuery('jwt');
    expect(result.terms).toEqual(['jwt']);
    expect(result.operator).toBe('AND');
  });

  it('defaults to AND for multiple bare terms', () => {
    const result = parseQuery('login flow user');
    expect(result.operator).toBe('AND');
  });
});
