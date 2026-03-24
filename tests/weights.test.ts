import { WeightMatrix } from '../src/weights';

describe('WeightMatrix', () => {
  it('initializes with uniform weights', () => {
    const wm = new WeightMatrix(['E', 'A'], 2);
    // 2 strings × 3 frets (0,1,2) = 6 positions
    const picked = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const { stringName, fret } = wm.pick();
      picked.add(`${stringName}:${fret}`);
    }
    // All 6 positions should appear with uniform sampling
    expect(picked.size).toBe(6);
  });

  it('increases weight on incorrect answer, clamped at 4.0', () => {
    const wm = new WeightMatrix(['E'], 0);
    wm.update('E', 0, false);
    wm.update('E', 0, false);
    wm.update('E', 0, false);
    wm.update('E', 0, false);
    wm.update('E', 0, false);
    // weight starts at 1.0, ×1.5 each wrong, clamped at 4.0
    expect(wm.getWeight('E', 0)).toBe(4.0);
  });

  it('decreases weight on correct answer, clamped at 0.5', () => {
    const wm = new WeightMatrix(['E'], 0);
    for (let i = 0; i < 10; i++) wm.update('E', 0, true);
    expect(wm.getWeight('E', 0)).toBe(0.5);
  });

  it('pick always returns a valid position', () => {
    const wm = new WeightMatrix(['G', 'B'], 3);
    for (let i = 0; i < 50; i++) {
      const { stringName, fret } = wm.pick();
      expect(['G', 'B']).toContain(stringName);
      expect(fret).toBeGreaterThanOrEqual(0);
      expect(fret).toBeLessThanOrEqual(3);
    }
  });
});
