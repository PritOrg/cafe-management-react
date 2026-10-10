import { describe, it, expect } from 'vitest';
import { slugFromHostname, resolveApiBaseUrl } from './api';

const RAW = 'http://localhost:4969/api/v1';

describe('slugFromHostname', () => {
  it('returns the subdomain slug', () => {
    expect(slugFromHostname('cafe2.localhost')).toBe('cafe2');
    expect(slugFromHostname('cafe1.example.com')).toBe('cafe1');
  });
  it('returns null for bare localhost / www / IP / single label', () => {
    expect(slugFromHostname('localhost')).toBeNull();
    expect(slugFromHostname('www.example.com')).toBeNull();
    expect(slugFromHostname('127.0.0.1')).toBeNull();
    expect(slugFromHostname('myhost')).toBeNull();
    expect(slugFromHostname('')).toBeNull();
  });
});

describe('resolveApiBaseUrl (menu/brand/settings follow the tenant slug)', () => {
  it('mirrors a tenant slug onto the localhost API host', () => {
    expect(resolveApiBaseUrl(RAW, 'cafe2.localhost')).toBe('http://cafe2.localhost:4969/api/v1');
    expect(resolveApiBaseUrl(RAW, 'cafe1.localhost')).toBe('http://cafe1.localhost:4969/api/v1');
  });
  it('leaves bare localhost unchanged (DEFAULT_TENANT_SLUG on the server)', () => {
    expect(resolveApiBaseUrl(RAW, 'localhost')).toBe(RAW);
  });
  it('replaces the first label for true subdomains', () => {
    expect(resolveApiBaseUrl('https://api.example.com/api/v1', 'cafe1.example.com'))
      .toBe('https://cafe1.example.com/api/v1');
  });
  it('passes through relative urls and IP hosts unchanged', () => {
    expect(resolveApiBaseUrl('/api/v1', 'cafe2.localhost')).toBe('/api/v1');
    expect(resolveApiBaseUrl(RAW, '127.0.0.1')).toBe(RAW);
  });
});
