"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stats = void 0;
class Stats {
    constructor() {
        this.correct = 0;
        this.incorrect = 0;
        this.responseTimes = [];
        this.positionMap = new Map();
    }
    record(isCorrect, responseTimeSeconds, stringName, fret) {
        if (isCorrect) {
            this.correct++;
        }
        else {
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
    total() {
        return this.correct + this.incorrect;
    }
    accuracy() {
        if (this.total() === 0)
            return 0;
        return (this.correct / this.total()) * 100;
    }
    avgResponseTime() {
        if (this.responseTimes.length === 0)
            return 0;
        const sum = this.responseTimes.reduce((a, b) => a + b, 0);
        return sum / this.responseTimes.length;
    }
    positionStats() {
        return new Map([...this.positionMap.entries()].map(([k, v]) => [k, { ...v }]));
    }
}
exports.Stats = Stats;
