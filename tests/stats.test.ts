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
    stats.record(true, 2.0);
    stats.record(true, 4.0);
    expect(stats.correct).toBe(2);
    expect(stats.incorrect).toBe(0);
    expect(stats.total()).toBe(2);
  });

  it('tracks incorrect answers', () => {
    stats.record(false, 3.0);
    expect(stats.correct).toBe(0);
    expect(stats.incorrect).toBe(1);
  });

  it('computes accuracy as percentage', () => {
    stats.record(true, 1.0);
    stats.record(true, 1.0);
    stats.record(false, 1.0);
    expect(stats.accuracy()).toBeCloseTo(66.67, 1);
  });

  it('computes average response time', () => {
    stats.record(true, 2.0);
    stats.record(true, 4.0);
    expect(stats.avgResponseTime()).toBe(3.0);
  });

  it('accuracy returns 0 when no answers recorded', () => {
    expect(stats.accuracy()).toBe(0);
  });
});
