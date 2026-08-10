import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/cn';

describe('cn (className utility)', () => {
  it('joins truthy string values with a space', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('filters out falsy values — false', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
  });

  it('filters out falsy values — null', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('filters out falsy values — undefined', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('returns an empty string when all values are falsy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });

  it('returns a single class untouched', () => {
    expect(cn('only-class')).toBe('only-class');
  });

  it('handles empty string arguments', () => {
    // empty string is falsy, should be filtered out
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('accepts conditional class expressions', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('works with zero arguments', () => {
    expect(cn()).toBe('');
  });

  it('preserves spacing inside individual class strings', () => {
    // Classes with spaces inside are uncommon but should be preserved
    expect(cn('text-sm font-bold', 'p-4')).toBe('text-sm font-bold p-4');
  });
});
