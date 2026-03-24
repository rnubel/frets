export class Stats {
  correct = 0;
  incorrect = 0;
  private responseTimes: number[] = [];
  private positionMap: Map<string, { correct: number; incorrect: number }> = new Map();

  record(isCorrect: boolean, responseTimeSeconds: number, stringName: string, fret: number): void {
    if (isCorrect) {
      this.correct++;
    } else {
      this.incorrect++;
    }
    this.responseTimes.push(responseTimeSeconds);

    const key = `${stringName}:${fret}`;
    const existing = this.positionMap.get(key) ?? { correct: 0, incorrect: 0 };
    this.positionMap.set(key, {
      correct: existing.correct + (isCorrect ? 1 : 0),
      incorrect: existing.incorrect + (isCorrect ? 0 : 1),
    });
  }

  total(): number {
    return this.correct + this.incorrect;
  }

  accuracy(): number {
    if (this.total() === 0) return 0;
    return (this.correct / this.total()) * 100;
  }

  avgResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  positionStats(): Map<string, { correct: number; incorrect: number }> {
    return this.positionMap;
  }
}
