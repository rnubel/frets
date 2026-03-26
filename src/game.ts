import * as readline from 'readline';
import chalk from 'chalk';
import { noteAtFret, parseNoteInput } from './notes';
import { Stats } from './stats';
import { renderFretboard } from './fretboard';
import { WeightMatrix } from './weights';
import { loadWeights, saveWeights } from './persistence';

export interface GameOptions {
  maxFret: number;
  strings: string[];
  fretboard: boolean;
  smart: boolean;
  debug: boolean;
  persistFile?: string;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function printSummary(stats: Stats): void {
  console.log('\n\n' + chalk.bold('Final Results'));
  console.log(`  Correct:   ${chalk.green(stats.correct)}`);
  console.log(`  Incorrect: ${chalk.red(stats.incorrect)}`);
  console.log(`  Accuracy:  ${stats.accuracy().toFixed(1)}%`);
  console.log(`  Avg time:  ${stats.avgResponseTime().toFixed(2)}s`);

  const pos = stats.positionStats();
  // Only show positions attempted more than once
  const entries = [...pos.entries()]
    .filter(([, v]) => v.correct + v.incorrect > 1)
    .map(([key, v]) => {
      const total = v.correct + v.incorrect;
      const acc = (v.correct / total) * 100;
      return { key, correct: v.correct, total, acc };
    })
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 5);

  if (entries.length > 0) {
    console.log(chalk.bold('\n  Weakest positions:'));
    for (const e of entries) {
      console.log(`    ${e.key.padEnd(5)} ${e.correct}/${e.total}  (${e.acc.toFixed(0)}%)`);
    }
  }
}

function formatStats(stats: Stats): string {
  const acc = stats.accuracy().toFixed(0);
  const avg = stats.avgResponseTime().toFixed(1);
  return chalk.dim(`Score: ${stats.correct}/${stats.total()} (${acc}%) | Avg: ${avg}s`);
}

export async function runGame(options: GameOptions): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const stats = new Stats();
  const initialWeights = options.persistFile ? loadWeights(options.persistFile) : undefined;
  const weightMatrix = options.smart ? new WeightMatrix(options.strings, options.maxFret, initialWeights) : undefined;

  if (options.persistFile && !options.smart) {
    console.warn('Warning: --persist has no effect without --smart');
  }

  // Re-enable terminal echo and prompt behavior
  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => {
      process.stdout.write(prompt);
      rl.once('line', resolve);
    });

  console.log(chalk.bold('\n🎸 Frets — Fretboard Trainer'));
  console.log(chalk.dim('Type the note name (e.g. G#, Bb, F). Ctrl+C to quit.\n'));

  // Handle Ctrl+C cleanly
  process.once('SIGINT', () => {
    printSummary(stats);
    if (options.persistFile && weightMatrix) {
      saveWeights(options.persistFile, weightMatrix.toJSON());
      console.log(`Weights saved to ${options.persistFile}`);
    }
    process.exit(0);
  });

  rl.once('close', () => {
    // stdin was closed (EOF or pipe end) — print summary and exit
    printSummary(stats);
    if (options.persistFile && weightMatrix) {
      saveWeights(options.persistFile, weightMatrix.toJSON());
      console.log(`Weights saved to ${options.persistFile}`);
    }
    process.exit(0);
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let stringName: string;
    let fret: number;
    if (weightMatrix) {
      ({ stringName, fret } = weightMatrix.pick());
    } else {
      stringName = options.strings[randomInt(0, options.strings.length - 1)];
      fret = randomInt(0, options.maxFret);
    }
    const correctNote = noteAtFret(stringName, fret);
    const correctSemitone = parseNoteInput(correctNote)!;

    // Prompt loop — re-ask on invalid input
    const firstPrompt = options.fretboard
      ? renderFretboard(options.maxFret, stringName, fret) + '\n> '
      : chalk.cyan(`String: ${stringName}`) + '  ' + chalk.yellow(`Fret: ${fret}`) + '\n> ';
    const retryPrompt = options.fretboard
      ? '> '
      : chalk.cyan(`String: ${stringName}`) + '  ' + chalk.yellow(`Fret: ${fret}`) + ' > ';

    let answered = false;
    let isFirst = true;
    let startTime = process.hrtime.bigint();
    while (!answered) {
      const raw = await question(isFirst ? firstPrompt : retryPrompt);
      isFirst = false;
      const elapsedSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;

      const parsed = parseNoteInput(raw.trim());

      if (parsed === null) {
        console.log(chalk.dim('  Invalid input — try again (e.g. G#, Bb, F)'));
        startTime = process.hrtime.bigint(); // reset timer for the retry
        continue;
      }

      answered = true;
      const isCorrect = parsed === correctSemitone;
      stats.record(isCorrect, elapsedSeconds, stringName, fret);
      if (weightMatrix) {
        const avgResponseTime = stats.avgResponseTime();
        const thisResponseTime = elapsedSeconds;
        const timeProportion = thisResponseTime / (avgResponseTime || 1); // avoid division by zero
        if (options.debug) {
          console.log(chalk.dim(`  Debug: timeProportion=${timeProportion.toFixed(2)} (this: ${thisResponseTime.toFixed(2)}s, avg: ${avgResponseTime.toFixed(2)}s)`));
          console.log(chalk.dim(`  Debug: updating weight for ${stringName}:${fret} (isCorrect=${isCorrect})`));
        }
        weightMatrix.update(stringName, fret, isCorrect, timeProportion);
      }

      if (isCorrect) {
        console.log(chalk.green(`  ✓ Correct! (${elapsedSeconds.toFixed(1)}s)`));
      } else {
        console.log(chalk.red(`  ✗ Wrong. The answer was ${correctNote}`));
      }

      console.log('  ' + formatStats(stats) + '\n');

      if (options.debug && weightMatrix) {
        console.log(chalk.dim(weightMatrix.debug()) + '\n');
      }
    }
  }
}
