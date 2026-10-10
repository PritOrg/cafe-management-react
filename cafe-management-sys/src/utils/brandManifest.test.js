import { describe, it, expect } from 'vitest';
import { buildManifest } from './brandManifest';

describe('buildManifest', () => {
  const origin = 'http://cafe2.localhost:3000';

  it('uses absolute start_url, scope and icon srcs (blob manifests need absolute urls)', () => {
    const m = buildManifest({ title: 'Cafe Two', primaryColor: '#123456' }, origin);
    expect(m.start_url).toBe('http://cafe2.localhost:3000/');
    expect(m.scope).toBe('http://cafe2.localhost:3000/');
    expect(m.icons.map((i) => i.src)).toEqual([
      'http://cafe2.localhost:3000/logo192.png',
      'http://cafe2.localhost:3000/logo512.png',
    ]);
    expect(m.theme_color).toBe('#123456');
    expect(m.display).toBe('standalone');
  });

  it('trims a trailing slash on the origin', () => {
    const m = buildManifest({ title: 'X' }, 'http://x.test/');
    expect(m.start_url).toBe('http://x.test/');
    expect(m.icons[0].src).toBe('http://x.test/logo192.png');
  });

  it('falls back to defaults for name/short_name/color and truncates short_name', () => {
    const m = buildManifest({}, 'http://x.test');
    expect(m.name).toBe('Restaurant');
    expect(m.short_name.length).toBeLessThanOrEqual(12);
    expect(m.theme_color).toBe('#ff6b35');
    const long = buildManifest({ title: 'A Very Long Brand Name Indeed' }, 'http://x.test');
    expect(long.short_name).toBe('A Very Long ');
  });
});
