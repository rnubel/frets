# Fretboard Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `--fretboard` flag that renders an ASCII fretboard in place of the text string/fret prompt, while keeping all game logic (scoring, stats, input parsing) identical.

**Architecture:** New pure function `renderFretboard` in `src/fretboard.ts`; `GameOptions` gains `fretboard: boolean`; `game.ts` switches on it for the prompt; `index.ts` adds the `--fretboard` CLI flag.

**Tech Stack:** TypeScript, chalk (v4, CJS), jest/ts-jest for tests. Run tests with `npm test`. Build with `npm run build`.

---

### Task 1: Create `src/fretboard.ts` with `renderFretboard`

**Files:**
- Create: `src/fretboard.ts`
- Create: `tests/fretboard.test.ts`

**Background — inlay marker rules:**
- D string = `STRINGS` index 2 (3rd from bottom). Gets dots at frets: 3, 7, 12, 15, 19
- G string = `STRINGS` index 3 (4th from bottom). Gets dots at frets: 5, 9, 12, 17, 21
- Fret 12 appears on both (double dot)
- `X` (target) takes priority over `⏺`
- Rows render top-to-bottom as: high E (index 5), B (4), G (3), D (2), A (1), low E (0)
- Format: `‖ X | ⏺ |   | ...` — nut glyph, then space-pipe-separated single-char cells

**Step 1: Write failing tests**

Create `tests/fretboard.test.ts`:

```ts
import { renderFretboard } from '../src/fretboard';

describe('renderFretboard', () => {
  it('returns 6 rows', () => {
    const output = renderFretboard(['E','A','D','G','B','E'], 15, 'A', 5);
    const lines = output.split('\n').filter(l => l.length > 0);
    expect(lines).toHaveLength(6);
  });

  it('each row starts with the nut glyph ‖', () => {
    const lines = renderFretboard(['E','A','D','G','B','E'], 15, 'A', 5)
      .split('\n').filter(l => l.length > 0);
    for (const line of lines) {
      expect(line.startsWith('‖')).toBe(true);
    }
  });

  it('each row has maxFret+1 cells', () => {
    const maxFret = 15;
    const lines = renderFretboard(['E','A','D','G','B','E'], maxFret, 'A', 5)
      .split('\n').filter(l => l.length > 0);
    for (const line of lines) {
      // cells separated by ' | ', so count pipes after nut
      const afterNut = line.slice(1); // remove ‖
      const cells = afterNut.split(' | ');
      expect(cells).toHaveLength(maxFret + 1);
    }
  });

  it('places X on correct string and fret', () => {
    // A string = index 1 from bottom → row index 4 from top (5 - 1)
    const lines = renderFretboard(['E','A','D','G','B','E'], 15, 'A', 11)
      .split('\n').filter(l => l.length > 0);
    // row 4 from top (0-indexed) is A string
    const aRow = lines[4];
    const cells = aRow.slice(1).split(' | ');
    expect(cells[11]).toBe('X');
    // all other strings should not have X at fret 11
    for (let i = 0; i < lines.length; i++) {
      if (i === 4) continue;
      const c = lines[i].slice(1).split(' | ');
      expect(c[11]).not.toBe('X');
    }
  });

  it('places ⏺ on D string at fret 3', () => {
    // D string = index 2 from bottom → row index 3 from top
    const lines = renderFretboard(['E','A','D','G','B','E'], 15, 'E', 0)
      .split('\n').filter(l => l.length > 0);
    const dRow = lines[3];
    const cells = dRow.slice(1).split(' | ');
    expect(cells[3]).toBe('⏺');
  });

  it('places ⏺ on G string at fret 5', () => {
    // G string = index 3 from bottom → row index 2 from top
    const lines = renderFretboard(['E','A','D','G','B','E'], 15, 'E', 0)
      .split('\n').filter(l => l.length > 0);
    const gRow = lines[2];
    const cells = gRow.slice(1).split(' | ');
    expect(cells[5]).toBe('⏺');
  });

  it('places ⏺ on both D and G string at fret 12 (double dot)', () => {
    const lines = renderFretboard(['E','A','D','G','B','E'], 15, 'E', 0)
      .split('\n').filter(l => l.length > 0);
    const dRow = lines[3];
    const gRow = lines[2];
    expect(dRow.slice(1).split(' | ')[12]).toBe('⏺');
    expect(gRow.slice(1).split(' | ')[12]).toBe('⏺');
  });

  it('X takes priority over ⏺ when target is on D string at fret 3', () => {
    // D string = index 2 from bottom → row index 3 from top
    const lines = renderFretboard(['E','A','D','G','B','E'], 15, 'D', 3)
      .split('\n').filter(l => l.length > 0);
    const dRow = lines[3];
    const cells = dRow.slice(1).split(' | ');
    expect(cells[3]).toBe('X');
  });

  it('does not place ⏺ beyond maxFret', () => {
    // maxFret=8 — fret 9 (G string dot) should not appear
    const lines = renderFretboard(['E','A','D','G','B','E'], 8, 'E', 0)
      .split('\n').filter(l => l.length > 0);
    const gRow = lines[2];
    const cells = gRow.slice(1).split(' | ');
    expect(cells).toHaveLength(9); // frets 0-8
    // no ⏺ at fret 9 (doesn't exist)
    expect(cells.every(c => c !== '⏺' || [5].includes(cells.indexOf(c)))).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=fretboard
```

Expected: compile error or "Cannot find module '../src/fretboard'"

**Step 3: Implement `src/fretboard.ts`**

```ts
// D string (STRINGS index 2) inlay frets
const D_INLAY_FRETS = new Set([3, 7, 12, 15, 19]);
// G string (STRINGS index 3) inlay frets
const G_INLAY_FRETS = new Set([5, 9, 12, 17, 21]);

/**
 * Renders an ASCII fretboard.
 *
 * @param strings - The full 6-string array (used only for row count; always renders EADGBE order)
 * @param maxFret - Highest fret to display (columns: 0..maxFret)
 * @param targetString - String name where X is placed (matched against EADGBE by last occurrence for high E)
 * @param targetFret - Fret number where X is placed
 * @returns Multi-line string, no trailing newline
 */
export function renderFretboard(
  _strings: string[],
  maxFret: number,
  targetString: string,
  targetFret: number
): string {
  // Fixed EADGBE order; rows top-to-bottom = high E (5) down to low E (0)
  const STRING_ORDER = ['E', 'A', 'D', 'G', 'B', 'E']; // index 0 = low E
  // Map targetString to its row index from top.
  // High E is the last 'E' (index 5 in STRING_ORDER); low E is index 0.
  // We match from the top row downward: top row = STRING_ORDER[5], ..., bottom = STRING_ORDER[0]
  // Find the last occurrence of targetString to prefer high E when string is 'E'.
  // Actually: the top row corresponds to STRING_ORDER[5], so we want the highest index match.
  let targetRowFromTop = -1;
  for (let i = STRING_ORDER.length - 1; i >= 0; i--) {
    if (STRING_ORDER[i] === targetString) {
      targetRowFromTop = STRING_ORDER.length - 1 - i;
      break;
    }
  }

  const rows: string[] = [];
  for (let rowFromTop = 0; rowFromTop < STRING_ORDER.length; rowFromTop++) {
    const stringIndex = STRING_ORDER.length - 1 - rowFromTop; // 5 down to 0
    const cells: string[] = [];

    for (let fret = 0; fret <= maxFret; fret++) {
      if (rowFromTop === targetRowFromTop && fret === targetFret) {
        cells.push('X');
      } else if (stringIndex === 2 && D_INLAY_FRETS.has(fret)) {
        cells.push('⏺');
      } else if (stringIndex === 3 && G_INLAY_FRETS.has(fret)) {
        cells.push('⏺');
      } else {
        cells.push(' ');
      }
    }

    rows.push('‖ ' + cells.join(' | '));
  }

  return rows.join('\n');
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=fretboard
```

Expected: all fretboard tests pass.

**Step 5: Run full test suite**

```bash
npm test
```

Expected: all tests pass (17 existing + new fretboard tests).

**Step 6: Commit**

```bash
git add src/fretboard.ts tests/fretboard.test.ts
git commit -m "feat: add renderFretboard pure function with inlay markers"
```

---

### Task 2: Wire `--fretboard` into `GameOptions` and `game.ts`

**Files:**
- Modify: `src/game.ts`

**Step 1: Add `fretboard` to `GameOptions` and switch prompt**

In `src/game.ts`, update `GameOptions`:

```ts
export interface GameOptions {
  maxFret: number;
  strings: string[];
  fretboard: boolean;
}
```

Replace the `question(...)` call inside the game loop:

```ts
// Before (text mode prompt):
const raw = await question(
  chalk.cyan(`String: ${stringName}`) + '  ' + chalk.yellow(`Fret: ${fret}`) + ' > '
);

// After:
const prompt = options.fretboard
  ? renderFretboard(options.strings, options.maxFret, stringName, fret) + '\n> '
  : chalk.cyan(`String: ${stringName}`) + '  ' + chalk.yellow(`Fret: ${fret}`) + ' > ';
const raw = await question(prompt);
```

Also add the import at the top of `game.ts`:

```ts
import { renderFretboard } from './fretboard';
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests still pass.

**Step 4: Commit**

```bash
git add src/game.ts
git commit -m "feat: add fretboard option to GameOptions and switch prompt in game loop"
```

---

### Task 3: Add `--fretboard` CLI flag in `index.ts`

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the flag and pass it through**

In `src/index.ts`, add the option:

```ts
.option('--fretboard', 'Show ASCII fretboard instead of text string/fret prompt')
```

And update the `runGame` call:

```ts
runGame({ maxFret, strings, fretboard: !!options.fretboard }).catch((err) => {
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add --fretboard CLI flag"
```

---

### Task 4: Build and smoke test

**Files:**
- Modify: `dist/` (compiled output)

**Step 1: Build**

```bash
npm run build
```

Expected: exits 0, `dist/` updated.

**Step 2: Smoke test — text mode still works**

```bash
echo "A" | node dist/index.js --max-fret 5
```

Expected: prints fretboard trainer header, shows a string/fret prompt, accepts "A", shows correct/incorrect, then exits with final results.

**Step 3: Smoke test — fretboard mode**

```bash
echo "A" | node dist/index.js --fretboard --max-fret 5
```

Expected: prints fretboard trainer header, renders the ASCII fretboard with `‖` nut and `X` on one cell, accepts "A", shows correct/incorrect.

**Step 4: Commit dist**

```bash
git add dist/
git commit -m "build: compile fretboard mode"
```
