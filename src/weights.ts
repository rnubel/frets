export class WeightMatrix {
  private weights: Map<string, number> = new Map();
  private positions: Array<{ stringName: string; fret: number }> = [];

  constructor(strings: string[], maxFret: number) {
    for (const stringName of strings) {
      for (let fret = 0; fret <= maxFret; fret++) {
        const key = `${stringName}:${fret}`;
        this.weights.set(key, 1.0);
        this.positions.push({ stringName, fret });
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

  update(stringName: string, fret: number, isCorrect: boolean): void {
    const key = `${stringName}:${fret}`;
    if (!this.weights.has(key)) {
      throw new Error(`Unknown position: ${key}`);
    }
    const current = this.weights.get(key) ?? 1.0;
    const next = isCorrect
      ? Math.max(0.5, current * 0.8)
      : Math.min(4.0, current * 1.5);
    this.weights.set(key, next);
  }

  getWeight(stringName: string, fret: number): number {
    return this.weights.get(`${stringName}:${fret}`) ?? 1.0;
  }
}
