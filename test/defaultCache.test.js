import defaultCache from '../lib/defaultCache';

describe('default cache', () => {
  it('should return value on match', () => {
    const cache = defaultCache(1, 2);
    expect(cache(1)).toBe(2);
  });

  it('should return undefined on no match', () => {
    const cache = defaultCache(1, 2);
    expect(cache(2)).toBe(undefined);
  });
});
