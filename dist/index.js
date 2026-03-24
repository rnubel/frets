#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const game_1 = require("./game");
const notes_1 = require("./notes");
const program = new commander_1.Command();
program
    .name('frets')
    .description('Fretboard trainer — learn your guitar notes')
    .option('--max-fret <n>', 'Maximum fret number (0–24)', '15')
    .option('--strings <list>', 'Comma-separated strings to drill (e.g. E,A,D)', 'E,A,D,G,B,E')
    .option('--fretboard', 'Show ASCII fretboard diagram instead of text prompt', false)
    .option('--smart', 'Weight note selection toward weaker positions', false)
    .action((options) => {
    const maxFret = parseInt(options.maxFret, 10);
    if (!/^\d+$/.test(options.maxFret) || isNaN(maxFret) || maxFret < 0 || maxFret > 24) {
        console.error('Error: --max-fret must be a number between 0 and 24');
        process.exit(1);
    }
    const strings = options.strings.split(',').map((s) => s.trim().toUpperCase());
    if (strings.some((s) => s === '')) {
        console.error('Error: --strings must not contain empty values (check for leading/trailing commas)');
        process.exit(1);
    }
    const validStrings = new Set(notes_1.STRINGS);
    for (const s of strings) {
        if (!validStrings.has(s)) {
            console.error(`Error: unknown string "${s}". Valid strings are: ${notes_1.STRINGS.join(', ')}`);
            process.exit(1);
        }
    }
    (0, game_1.runGame)({ maxFret, strings, fretboard: options.fretboard, smart: options.smart }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
});
program.parse(process.argv);
