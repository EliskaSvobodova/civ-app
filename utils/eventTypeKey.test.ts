import { describe, expect, it } from 'vitest';

import { slugifyCustomKey } from '@/utils/eventTypeKey';

describe('slugifyCustomKey', () => {
  it('prefixes a slugified label with custom_', () => {
    expect(slugifyCustomKey('  Foo Bar! ')).toBe('custom_foo_bar');
  });

  it('falls back to custom_event when nothing alphanumeric remains', () => {
    expect(slugifyCustomKey('!!!')).toBe('custom_event');
    expect(slugifyCustomKey('   ')).toBe('custom_event');
  });

  it('truncates the slug portion to 48 characters', () => {
    const key = slugifyCustomKey('a'.repeat(60));
    expect(key.startsWith('custom_')).toBe(true);
    expect(key.slice('custom_'.length).length).toBe(48);
  });
});
