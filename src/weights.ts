export class WeightMatrix {
  private weights: Map<string, number> = new Map();
  private positions: Array<{ stringName: string; fret: number }> = [];

  constructor(strings: string[], maxFret: number, initialWeights?: Record<string, number>) {
    for (const stringName of strings) {
      for (let fret = 0; fret <= maxFret; fret++) {
        const key = `${stringName}:${fret}`;
        this.weights.set(key, 1.0);
        this.positions.push({ stringName, fret });
      }
    }
    // Apply initial weights, clamped to valid range, ignoring unknown keys
    if (initialWeights) {
      for (const [key, value] of Object.entries(initialWeights)) {
        if (this.weights.has(key)) {
          this.weights.set(key, Math.min(4.0, Math.max(0.5, value)));
        }
      }
    }
  }

  pick(): { stringName: string; fret: number } {
    if (this.positions.length === 0) {
      throw new Error('WeightMatrix has no positions');
    }
    const totalWeight = this.positions.reduce(
      (sum, p) => sum + this.weights.get(`${p.stringName}:${p.fret}`)!,
      0
    );
    let r = Math.random() * totalWeight;
    for (const p of this.positions) {
      r -= this.weights.get(`${p.stringName}:${p.fret}`)!;
      if (r <= 0) return p;
    }
    return this.positions[this.positions.length - 1];
  }

  update(stringName: string, fret: number, isCorrect: boolean, timeProportion: number): void {
    const key = `${stringName}:${fret}`;
    if (!this.weights.has(key)) {
      throw new Error(`Unknown position: ${key}`);
    }
    const current = this.weights.get(key) ?? 1.0;
    const next = isCorrect
      ? Math.max(0.5, current * 0.8 * Math.pow(timeProportion, 0.1)) // faster correct answers reduce weight more
      : Math.min(4.0, current * 1.5 * Math.pow(timeProportion, 0.1)); // slower incorrect answers increase weight more

    this.weights.set(key, next);
  }

  getWeight(stringName: string, fret: number): number {
    return this.weights.get(`${stringName}:${fret}`) ?? 1.0;
  }

  toJSON(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.weights.entries()) {
      result[key] = value;
    }
    return result;
  }

  debug(): string {
    const rows: string[] = [];
    for (const str of ['E', 'A', 'D', 'G', 'B', 'E'].reverse()) {
      const frets = [];
      for (let fret = 0; fret <= 15; fret++) {
        const w = this.getWeight(str, fret);
        frets.push(w.toFixed(1).padEnd(3));
      }

      rows.push(frets[0] + ' ‖ ' + frets.slice(1).join(" | "))
    }

    return rows.join('\n');
  }
}
