# Frets CLI Game — Design

**Date:** 2026-03-24

## Overview

A Node.js/TypeScript CLI game that drills guitar fretboard note recognition. The user is shown a string name and fret number, and must type the correct note name. The game tracks correct/incorrect counts and average response time.

## Architecture

**Package structure:**
```
frets/
  src/
    index.ts      — entry point, CLI arg parsing, starts game
    game.ts       — core game loop
    notes.ts      — note lookup table, input parser/normalizer
    stats.ts      — score and response time tracking
  package.json
  tsconfig.json
```

**Dependencies:**
- `commander` — CLI arg parsing (`--max-fret`, `--strings`)
- `chalk` — colored terminal output
- `readline` (Node built-in) — line-by-line input for the game loop
- `typescript`, `ts-node` — dev dependencies

## Data Model

### Note Table (`src/notes.ts`)

Standard guitar tuning (EADGBE). Open string root notes:
- String E (low) = E2
- String A = A2
- String D = D3
- String G = G3
- String B = B3
- String E (high) = E4

Each fret adds one semitone. The chromatic scale (12 notes) repeats. Canonical note names use sharps: `C C# D D# E F F# G G# A A# B`.

### Input Normalization

Accepted input forms (case-insensitive):
- `e`, `g#`, `gb` — letter + optional accidental symbol
- `g sharp`, `g flat` — letter + word modifier
- Enharmonic equivalents are all accepted (e.g. `F#` and `Gb` are both correct for the same note)

Normalization: parse to a semitone index (0–11), compare against expected semitone index.

## Game Loop (`src/game.ts`)

1. Pick a random string from the active set and a random fret in `[0, maxFret]`
2. Display prompt: `String: G  Fret: 5 > `
3. Start a high-resolution timer (`process.hrtime.bigint()`)
4. Read user input line
5. Stop timer, parse and validate answer
6. Display result:
   - Correct: green `✓ Correct! (2.1s)`
   - Wrong: red `✗ Wrong. The answer was G#`
7. Display running stats: `Score: 12/15 (80%) | Avg: 3.2s`
8. Repeat until `Ctrl+C`
9. On exit (SIGINT): print final summary and exit cleanly

## CLI Args (`src/index.ts`)

| Flag | Default | Description |
|------|---------|-------------|
| `--max-fret <n>` | `15` | Maximum fret number (inclusive) |
| `--strings <list>` | `E,A,D,G,B,E` | Comma-separated list of strings to drill |

## Stats (`src/stats.ts`)

Tracks:
- `correct: number`
- `incorrect: number`
- `responseTimes: number[]` (seconds)

Computes:
- `total()` — correct + incorrect
- `accuracy()` — correct / total as percentage
- `avgResponseTime()` — mean of responseTimes

## Error Handling

- Invalid input (unrecognizable note): display `"Invalid input — try again (e.g. G#, Bb, F)"` and re-prompt without counting against the score
- `--max-fret` out of range (< 0 or > 24): exit with error message
- `--strings` with unrecognized string names: exit with error message
