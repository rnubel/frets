# Frets CLI Game Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js/TypeScript CLI game that drills guitar fretboard note recognition with score tracking and response time stats.

**Architecture:** Four source files — `notes.ts` (note math + input parsing), `stats.ts` (score/time tracking), `game.ts` (game loop), `index.ts` (CLI entry point). Uses `commander` for args and `chalk` for colored output.

**Tech Stack:** TypeScript, Node.js 18+, commander, chalk, readline (built-in), ts-node (dev), jest + ts-jest (tests)

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/` (directory)
- Create: `tests/` (directory)

**Step 1: Initialize package.json**

```bash
cd /Users/rnubel/Sandbox/rnubel/frets
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install commander chalk
npm install --save-dev typescript ts-node ts-jest jest @types/jest @types/node
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 4: Add scripts to package.json**

Edit `package.json` to add:
```json
{
  "main": "dist/index.js",
  "bin": {
    "frets": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "ts-node src/index.ts",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.ts"]
  }
}
```

**Step 5: Create src/ and tests/ directories**

```bash
mkdir -p src tests
```

**Step 6: Verify setup compiles (empty check)**

```bash
echo '{}' > src/index.ts
npx tsc --noEmit
```
Expected: no errors (or only "empty program" warning)

**Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold TypeScript project with jest"
```

---

### Task 2: Note lookup and input parsing (`src/notes.ts`)

**Files:**
- Create: `src/notes.ts`
- Create: `tests/notes.test.ts`

**Step 1: Write the failing tests**

Create `tests/notes.test.ts`:

```typescript
import { noteAtFret, parseNoteInput, STRINGS } from '../src/notes';

describe('noteAtFret', () => {
  it('returns correct open string notes', () => {
    expect(noteAtFret('E', 0)).toBe('E');  // low E open
    expect(noteAtFret('A', 0)).toBe('A');
    expect(noteAtFret('D', 0)).toBe('D');
    expect(noteAtFret('G', 0)).toBe('G');
    expect(noteAtFret('B', 0)).toBe('B');
  });

  it('returns correct note at fret 1', () => {
    expect(noteAtFret('E', 1)).toBe('F');
    expect(noteAtFret('A', 1)).toBe('A#');
    expect(noteAtFret('B', 1)).toBe('C');
  });

  it('returns correct note at fret 5', () => {
    expect(noteAtFret('E', 5)).toBe('A');   // classic: E string fret 5 = A
    expect(noteAtFret('A', 5)).toBe('D');   // A string fret 5 = D
    expect(noteAtFret('D', 5)).toBe('G');
    expect(noteAtFret('G', 5)).toBe('C');
    expect(noteAtFret('B', 5)).toBe('E');
  });

  it('wraps correctly at octave boundary', () => {
    expect(noteAtFret('E', 12)).toBe('E');  // octave = same note
  });
});

describe('parseNoteInput', () => {
  it('parses simple note names', () => {
    expect(parseNoteInput('E')).toBe(4);   // E = semitone index 4
    expect(parseNoteInput('e')).toBe(4);   // case insensitive
    expect(parseNoteInput('C')).toBe(0);
    expect(parseNoteInput('G')).toBe(7);
  });

  it('parses sharp notes with # symbol', () => {
    expect(parseNoteInput('G#')).toBe(8);
    expect(parseNoteInput('g#')).toBe(8);
    expect(parseNoteInput('F#')).toBe(6);
  });

  it('parses flat notes with b symbol', () => {
    expect(parseNoteInput('Gb')).toBe(6);  // Gb = F# = semitone 6
    expect(parseNoteInput('gb')).toBe(6);
    expect(parseNoteInput('Bb')).toBe(10);
  });

  it('parses word modifiers', () => {
    expect(parseNoteInput('G sharp')).toBe(8);
    expect(parseNoteInput('g flat')).toBe(6);
    expect(parseNoteInput('B flat')).toBe(10);
    expect(parseNoteInput('E sharp')).toBe(5);  // E# = F
    expect(parseNoteInput('C flat')).toBe(11);  // Cb = B
  });

  it('returns null for invalid input', () => {
    expect(parseNoteInput('')).toBeNull();
    expect(parseNoteInput('H')).toBeNull();
    expect(parseNoteInput('X#')).toBeNull();
    expect(parseNoteInput('G##')).toBeNull();
  });

  it('accepts enharmonic equivalents as the same semitone', () => {
    // F# and Gb are the same semitone
    expect(parseNoteInput('F#')).toBe(parseNoteInput('Gb'));
  });
});

describe('STRINGS', () => {
  it('exports 6 strings in standard tuning order', () => {
    expect(STRINGS).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest tests/notes.test.ts
```
Expected: FAIL (module not found)

**Step 3: Implement `src/notes.ts`**

```typescript
// Chromatic scale using sharps as canonical form
// Index 0 = C, 1 = C#, 2 = D, 3 = D#, 4 = E, 5 = F, 6 = F#,
//        7 = G, 8 = G#, 9 = A, 10 = A#, 11 = B
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Standard guitar tuning: low E to high E
export const STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'] as const;
export type StringName = typeof STRINGS[number];

// Open string root note semitone indices
const OPEN_STRING_SEMITONES: Record<string, number> = {
  // We use position-based lookup since 'E' appears twice;
  // callers use string index, but we also accept string name for the 5 unique ones.
  // Store by string label for the game (low E and high E both treated as 'E').
};

const OPEN_NOTES: number[] = [4, 9, 2, 7, 11, 4]; // E A D G B E (semitone indices)

/** Returns the canonical note name (using sharps) for a given string and fret. */
export function noteAtFret(stringName: string, fret: number): string {
  // Find the first matching string index (handles both E strings the same way)
  const stringIndex = STRINGS.indexOf(stringName as StringName);
  if (stringIndex === -1) {
    throw new Error(`Unknown string: ${stringName}`);
  }
  const semitone = (OPEN_NOTES[stringIndex] + fret) % 12;
  return CHROMATIC[semitone];
}

/** Returns the semitone index (0-11) for a note string, or null if unparseable. */
export function parseNoteInput(input: string): number | null {
  if (!input || input.trim() === '') return null;

  const trimmed = input.trim().toLowerCase();

  // Map note letters to semitone base values
  const NOTE_MAP: Record<string, number> = {
    c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11
  };

  // Try formats: "g#", "gb", "g sharp", "g flat", "g"
  const match = trimmed.match(/^([a-g])\s*(#|b|sharp|flat)?$/);
  if (!match) return null;

  const letter = match[1];
  const modifier = match[2] ?? '';

  if (!(letter in NOTE_MAP)) return null;

  let semitone = NOTE_MAP[letter];

  if (modifier === '#' || modifier === 'sharp') {
    semitone = (semitone + 1) % 12;
  } else if (modifier === 'b' || modifier === 'flat') {
    semitone = (semitone + 11) % 12; // subtract 1 with wrap
  }

  return semitone;
}
```

**Step 4: Run tests to verify they pass**

```bash
npx jest tests/notes.test.ts
```
Expected: all PASS

**Step 5: Commit**

```bash
git add src/notes.ts tests/notes.test.ts
git commit -m "feat: add note lookup table and input parser"
```

---

### Task 3: Stats tracker (`src/stats.ts`)

**Files:**
- Create: `src/stats.ts`
- Create: `tests/stats.test.ts`

**Step 1: Write failing tests**

Create `tests/stats.test.ts`:

```typescript
import { Stats } from '../src/stats';

describe('Stats', () => {
  let stats: Stats;

  beforeEach(() => {
    stats = new Stats();
  });

  it('starts at zero', () => {
    expect(stats.correct).toBe(0);
    expect(stats.incorrect).toBe(0);
    expect(stats.total()).toBe(0);
    expect(stats.accuracy()).toBe(0);
    expect(stats.avgResponseTime()).toBe(0);
  });

  it('tracks correct answers', () => {
    stats.record(true, 2.0);
    stats.record(true, 4.0);
    expect(stats.correct).toBe(2);
    expect(stats.incorrect).toBe(0);
    expect(stats.total()).toBe(2);
  });

  it('tracks incorrect answers', () => {
    stats.record(false, 3.0);
    expect(stats.correct).toBe(0);
    expect(stats.incorrect).toBe(1);
  });

  it('computes accuracy as percentage', () => {
    stats.record(true, 1.0);
    stats.record(true, 1.0);
    stats.record(false, 1.0);
    expect(stats.accuracy()).toBeCloseTo(66.67, 1);
  });

  it('computes average response time', () => {
    stats.record(true, 2.0);
    stats.record(true, 4.0);
    expect(stats.avgResponseTime()).toBe(3.0);
  });

  it('accuracy returns 0 when no answers recorded', () => {
    expect(stats.accuracy()).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest tests/stats.test.ts
```
Expected: FAIL (module not found)

**Step 3: Implement `src/stats.ts`**

```typescript
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
```

**Step 4: Run tests to verify they pass**

```bash
npx jest tests/stats.test.ts
```
Expected: all PASS

**Step 5: Commit**

```bash
git add src/stats.ts tests/stats.test.ts
git commit -m "feat: add stats tracker"
```

---

### Task 4: Game loop (`src/game.ts`)

**Files:**
- Create: `src/game.ts`

No unit tests for this module — it's pure I/O. Manual testing in Task 6.

**Step 1: Implement `src/game.ts`**

```typescript
import * as readline from 'readline';
import chalk from 'chalk';
import { noteAtFret, parseNoteInput, STRINGS } from './notes';
import { Stats } from './stats';

export interface GameOptions {
  maxFret: number;
  strings: string[];
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
    terminal: false,
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
  process.on('SIGINT', () => {
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
    while (!answered) {
      const startTime = process.hrtime.bigint();
      const raw = await question(
        chalk.cyan(`String: ${stringName}`) + '  ' + chalk.yellow(`Fret: ${fret}`) + ' > '
      );
      const elapsedSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;

      const parsed = parseNoteInput(raw.trim());

      if (parsed === null) {
        console.log(chalk.dim('  Invalid input — try again (e.g. G#, Bb, F)'));
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
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/game.ts
git commit -m "feat: add game loop"
```

---

### Task 5: CLI entry point (`src/index.ts`)

**Files:**
- Modify: `src/index.ts`

**Step 1: Implement `src/index.ts`**

```typescript
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
  .action((options) => {
    const maxFret = parseInt(options.maxFret, 10);
    if (isNaN(maxFret) || maxFret < 0 || maxFret > 24) {
      console.error('Error: --max-fret must be a number between 0 and 24');
      process.exit(1);
    }

    const strings = options.strings.split(',').map((s: string) => s.trim().toUpperCase());
    const validStrings = new Set(STRINGS);
    for (const s of strings) {
      if (!validStrings.has(s as typeof STRINGS[number])) {
        console.error(`Error: unknown string "${s}". Valid strings are: ${STRINGS.join(', ')}`);
        process.exit(1);
      }
    }

    runGame({ maxFret, strings }).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  });

program.parse(process.argv);
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI entry point with commander"
```

---

### Task 6: Build, smoke test, and wire up bin

**Step 1: Run the full test suite**

```bash
npx jest
```
Expected: all tests PASS

**Step 2: Build the project**

```bash
npx tsc
```
Expected: `dist/` directory created with compiled JS

**Step 3: Make the entry point executable**

```bash
chmod +x dist/index.js
```

**Step 4: Add shebang to compiled output** (tsc doesn't preserve shebangs perfectly — verify `dist/index.js` starts with `#!/usr/bin/env node`; if not, add it manually or add a postbuild script)

**Step 5: Smoke test with ts-node**

```bash
npx ts-node src/index.ts --max-fret 5 --strings E,A
```
Expected: game starts, shows prompts, accepts input, shows correct/wrong feedback and stats

**Step 6: Test --max-fret validation**

```bash
npx ts-node src/index.ts --max-fret 99
```
Expected: error message and exit code 1

**Step 7: Test --strings validation**

```bash
npx ts-node src/index.ts --strings E,X,D
```
Expected: error message about unknown string "X"

**Step 8: Final commit**

```bash
git add dist/ .gitignore
git commit -m "build: add compiled output and smoke test"
```

(Add a `.gitignore` that ignores `node_modules/` but includes `dist/` for easy install)

---

## .gitignore

```
node_modules/
*.js.map
```

(Keep `dist/` tracked so users can `npm link` without a build step, or omit dist and rely on `ts-node` for running directly.)
