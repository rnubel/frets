export class Stats {
  correct = 0;
  incorrect = 0;
  private responseTimes: number[] = [];

  record(isCorrect: boolean, responseTimeSeconds: number): void {
    if (isCorrect) {
      this.correct++;
    } else {
      this.incorrect++;
    }
    this.responseTimes.push(responseTimeSeconds);
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
}
