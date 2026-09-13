import { getEffectiveCount, getValidCountOptions } from './practice.component';

describe('practice availability', () => {
  it('handles zero available questions', () => expect(getValidCountOptions(0, false)).toEqual([]));
  it('offers 1 and all for one question', () => expect(getValidCountOptions(1, false)).toEqual([1]));
  it('offers 1, 2 and all for two questions', () => expect(getValidCountOptions(2, false)).toEqual([1, 2]));
  it('offers standard counts for thirteen questions', () => expect(getValidCountOptions(13, false)).toEqual([5, 10]));
  it('offers standard counts for ninety-eight questions', () => expect(getValidCountOptions(98, false)).toEqual([5, 10, 20, 30, 50]));
  it('clamps a stale selection to the largest valid option', () => expect(getEffectiveCount(30, [5, 10])).toBe(10));
});
