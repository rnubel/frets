import * as readline from 'readline';
import chalk from 'chalk';
import { noteAtFret, parseNoteInput } from './notes';
import { Stats } from './stats';
import { renderFretboard } from './fretboard';

export interface GameOptions {
  maxFret: number;
  strings: string[];
  fretboard: boolean;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    console.log('\n\n' + chalk.bold('Final Results'));
    console.log(`  Correct:   ${chalk.green(stats.correct)}`);
    console.log(`  Incorrect: ${chalk.red(stats.incorrect)}`);
    console.log(`  Accuracy:  ${stats.accuracy().toFixed(1)}%`);
    console.log(`  Avg time:  ${stats.avgResponseTime().toFixed(2)}s`);
    process.exit(0);
  });

  rl.once('close', () => {
    // stdin was closed (EOF or pipe end) — print summary and exit
    console.log('\n\n' + chalk.bold('Final Results'));
    console.log(`  Correct:   ${chalk.green(stats.correct)}`);
    console.log(`  Incorrect: ${chalk.red(stats.incorrect)}`);
    console.log(`  Accuracy:  ${stats.accuracy().toFixed(1)}%`);
    console.log(`  Avg time:  ${stats.avgResponseTime().toFixed(2)}s`);
    process.exit(0);
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const stringName = options.strings[randomInt(0, options.strings.length - 1)];
    const fret = randomInt(0, options.maxFret);
    const correctNote = noteAtFret(stringName, fret);
    const correctSemitone = parseNoteInput(correctNote)!;

    // Prompt loop — re-ask on invalid input
    let answered = false;
    let startTime = process.hrtime.bigint();
    while (!answered) {
      const prompt = options.fretboard
        ? renderFretboard(options.maxFret, stringName, fret) + '\n> '
        : chalk.cyan(`String: ${stringName}`) + '  ' + chalk.yellow(`Fret: ${fret}`) + ' > ';
      const raw = await question(prompt);
      const elapsedSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;

      const parsed = parseNoteInput(raw.trim());

      if (parsed === null) {
        console.log(chalk.dim('  Invalid input — try again (e.g. G#, Bb, F)'));
        startTime = process.hrtime.bigint(); // reset timer for the retry
        continue;
      }

      answered = true;
      const isCorrect = parsed === correctSemitone;
      stats.record(isCorrect, elapsedSeconds);

      if (isCorrect) {
        console.log(chalk.green(`  ✓ Correct! (${elapsedSeconds.toFixed(1)}s)`));
      } else {
        console.log(chalk.red(`  ✗ Wrong. The answer was ${correctNote}`));
      }

      console.log('  ' + formatStats(stats) + '\n');
    }
  }
}
