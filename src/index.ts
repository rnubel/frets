#!/usr/bin/env node
import { Command } from 'commander';
import { runGame } from './game';
import { STRINGS } from './notes';

const program = new Command();

program
  .name('frets')
  .description('Fretboard trainer — learn your guitar notes')
  .option('--max-fret <n>', 'Maximum fret number (0–24)', '15')
  .option('--strings <list>', 'Comma-separated strings to drill (e.g. E,A,D)', 'E,A,D,G,B,E')
  .option('--fretboard', 'Show ASCII fretboard diagram instead of text prompt', false)
  .action((options) => {
    const maxFret = parseInt(options.maxFret, 10);
    if (!/^\d+$/.test(options.maxFret) || isNaN(maxFret) || maxFret < 0 || maxFret > 24) {
      console.error('Error: --max-fret must be a number between 0 and 24');
      process.exit(1);
    }

    const strings = options.strings.split(',').map((s: string) => s.trim().toUpperCase());
    if (strings.some((s: string) => s === '')) {
      console.error('Error: --strings must not contain empty values (check for leading/trailing commas)');
      process.exit(1);
    }
    const validStrings = new Set<string>(STRINGS);
    for (const s of strings) {
      if (!validStrings.has(s)) {
        console.error(`Error: unknown string "${s}". Valid strings are: ${STRINGS.join(', ')}`);
        process.exit(1);
      }
    }

    runGame({ maxFret, strings, fretboard: options.fretboard as boolean }).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  });

program.parse(process.argv);
