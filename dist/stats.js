"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stats = void 0;
class Stats {
    constructor() {
        this.correct = 0;
        this.incorrect = 0;
        this.responseTimes = [];
    }
    record(isCorrect, responseTimeSeconds) {
        if (isCorrect) {
            this.correct++;
        }
        else {
            this.incorrect++;
        }
        this.responseTimes.push(responseTimeSeconds);
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
}
exports.Stats = Stats;
