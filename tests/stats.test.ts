import { Stats } from '../src/stats';

describe('Stats', () => {
  let stats: Stats;

  beforeEach(() => {
    stats = new Stats();
  });

  it('starts at zero', () => {
    expect(stats.correct).toBe(0);
    expect(stats.incorrect).toBe(0);
    expect(stats.total()).toBe(0);
    expect(stats.accuracy()).toBe(0);
    expect(stats.avgResponseTime()).toBe(0);
  });

  it('tracks correct answers', () => {
    stats.record(true, 2.0, 'E', 0);
    stats.record(true, 4.0, 'E', 0);
    expect(stats.correct).toBe(2);
    expect(stats.incorrect).toBe(0);
    expect(stats.total()).toBe(2);
  });

  it('tracks incorrect answers', () => {
    stats.record(false, 3.0, 'E', 0);
    expect(stats.correct).toBe(0);
    expect(stats.incorrect).toBe(1);
  });

  it('computes accuracy as percentage', () => {
    stats.record(true, 1.0, 'E', 0);
    stats.record(true, 1.0, 'E', 0);
    stats.record(false, 1.0, 'E', 0);
    expect(stats.accuracy()).toBeCloseTo(66.67, 1);
  });

  it('computes average response time', () => {
    stats.record(true, 2.0, 'E', 0);
    stats.record(true, 4.0, 'E', 0);
    expect(stats.avgResponseTime()).toBe(3.0);
  });

  it('accuracy returns 0 when no answers recorded', () => {
    expect(stats.accuracy()).toBe(0);
  });

  it('tracks per-position stats', () => {
    stats.record(true, 1.0, 'E', 5);
    stats.record(false, 2.0, 'E', 5);
    stats.record(true, 1.5, 'A', 3);
    stats.record(true, 1.0, 'E', 6); // neighbor — should not affect E:5

    const pos = stats.positionStats();
    expect(pos.get('E:5')).toEqual({ correct: 1, incorrect: 1, responseTimes: [1.0, 2.0] });
    expect(pos.get('A:3')).toEqual({ correct: 1, incorrect: 0, responseTimes: [1.5] });
    expect(pos.get('E:6')).toEqual({ correct: 1, incorrect: 0, responseTimes: [1.0] });
  });

  it('positionStats returns empty map when nothing recorded', () => {
    expect(stats.positionStats().size).toBe(0);
  });
});
