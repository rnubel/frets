"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGame = runGame;
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const notes_1 = require("./notes");
const stats_1 = require("./stats");
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function formatStats(stats) {
    const acc = stats.accuracy().toFixed(0);
    const avg = stats.avgResponseTime().toFixed(1);
    return chalk_1.default.dim(`Score: ${stats.correct}/${stats.total()} (${acc}%) | Avg: ${avg}s`);
}
async function runGame(options) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const stats = new stats_1.Stats();
    // Re-enable terminal echo and prompt behavior
    const question = (prompt) => new Promise((resolve) => {
        process.stdout.write(prompt);
        rl.once('line', resolve);
    });
    console.log(chalk_1.default.bold('\n🎸 Frets — Fretboard Trainer'));
    console.log(chalk_1.default.dim('Type the note name (e.g. G#, Bb, F). Ctrl+C to quit.\n'));
    // Handle Ctrl+C cleanly
    process.once('SIGINT', () => {
        console.log('\n\n' + chalk_1.default.bold('Final Results'));
        console.log(`  Correct:   ${chalk_1.default.green(stats.correct)}`);
        console.log(`  Incorrect: ${chalk_1.default.red(stats.incorrect)}`);
        console.log(`  Accuracy:  ${stats.accuracy().toFixed(1)}%`);
        console.log(`  Avg time:  ${stats.avgResponseTime().toFixed(2)}s`);
        process.exit(0);
    });
    rl.once('close', () => {
        // stdin was closed (EOF or pipe end) — print summary and exit
        console.log('\n\n' + chalk_1.default.bold('Final Results'));
        console.log(`  Correct:   ${chalk_1.default.green(stats.correct)}`);
        console.log(`  Incorrect: ${chalk_1.default.red(stats.incorrect)}`);
        console.log(`  Accuracy:  ${stats.accuracy().toFixed(1)}%`);
        console.log(`  Avg time:  ${stats.avgResponseTime().toFixed(2)}s`);
        process.exit(0);
    });
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const stringName = options.strings[randomInt(0, options.strings.length - 1)];
        const fret = randomInt(0, options.maxFret);
        const correctNote = (0, notes_1.noteAtFret)(stringName, fret);
        const correctSemitone = (0, notes_1.parseNoteInput)(correctNote);
        // Prompt loop — re-ask on invalid input
        let answered = false;
        while (!answered) {
            const startTime = process.hrtime.bigint();
            const raw = await question(chalk_1.default.cyan(`String: ${stringName}`) + '  ' + chalk_1.default.yellow(`Fret: ${fret}`) + ' > ');
            const elapsedSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;
            const parsed = (0, notes_1.parseNoteInput)(raw.trim());
            if (parsed === null) {
                console.log(chalk_1.default.dim('  Invalid input — try again (e.g. G#, Bb, F)'));
                continue;
            }
            answered = true;
            const isCorrect = parsed === correctSemitone;
            stats.record(isCorrect, elapsedSeconds);
            if (isCorrect) {
                console.log(chalk_1.default.green(`  ✓ Correct! (${elapsedSeconds.toFixed(1)}s)`));
            }
            else {
                console.log(chalk_1.default.red(`  ✗ Wrong. The answer was ${correctNote}`));
            }
            console.log('  ' + formatStats(stats) + '\n');
        }
    }
}
