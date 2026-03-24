# NOTES.md Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix backspace bug in text mode, add per-position stats tracking, and add `--smart` flag for weighted note selection.

**Architecture:** Three independent improvements: (1) split the text-mode prompt onto two lines so backspace can't eat the label, (2) extend `Stats` to record per-`(string,fret)` outcomes for heatmap data, (3) add a `WeightMatrix` class that biases selection toward weak positions when `--smart` is active.

**Tech Stack:** TypeScript, Node.js readline, Jest for tests, chalk for terminal output, commander for CLI.

---

### Task 1: Create feature branch

**Files:**
- No files changed

**Step 1: Create and switch to branch**

```bash
git checkout -b feat/notes-feedback
```

**Step 2: Verify**

```bash
git branch
```
Expected: `* feat/notes-feedback`

---

### Task 2: Fix backspace bug in text mode

**Files:**
- Modify: `src/game.ts:69-74`

**Step 1: Run existing tests to confirm baseline passes**

```bash
npm test
```
Expected: all tests pass.

**Step 2: Apply fix**

In `src/game.ts`, change the `firstPrompt` for non-fretboard mode from an inline string to a two-line string. The string/fret info goes on its own line, then `> ` on the next:

```typescript
const firstPrompt = options.fretboard
  ? renderFretboard(options.maxFret, stringName, fret) + '\n> '
  : chalk.cyan(`String: ${stringName}`) + '  ' + chalk.yellow(`Fret: ${fret}`) + '\n> ';
```

(The `retryPrompt` lines are unchanged.)

**Step 3: Run tests**

```bash
npm test
```
Expected: all tests still pass (no test covers prompt format directly, but nothing should break).

**Step 4: Commit**

```bash
git add src/game.ts
git commit -m "fix: put string/fret label on its own line to prevent backspace erasure"
```

---

### Task 3: Extend Stats to track per-position outcomes

**Files:**
- Modify: `src/stats.ts`
- Modify: `tests/stats.test.ts`

**Step 1: Write failing tests for new behavior**

Add to `tests/stats.test.ts`:

```typescript
it('tracks per-position stats', () => {
  stats.record(true, 1.0, 'E', 5);
  stats.record(false, 2.0, 'E', 5);
  stats.record(true, 1.5, 'A', 3);

  const pos = stats.positionStats();
  expect(pos.get('E:5')).toEqual({ correct: 1, incorrect: 1 });
  expect(pos.get('A:3')).toEqual({ correct: 1, incorrect: 0 });
});

it('positionStats returns empty map when nothing recorded', () => {
  expect(stats.positionStats().size).toBe(0);
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern stats
```
Expected: FAIL — `record` doesn't accept string/fret args, `positionStats` doesn't exist.

**Step 3: Update Stats class**

Replace `src/stats.ts` with:

```typescript
export class Stats {
  correct = 0;
  incorrect = 0;
  private responseTimes: number[] = [];
  private positionMap: Map<string, { correct: number; incorrect: number }> = new Map();

  record(isCorrect: boolean, responseTimeSeconds: number, stringName: string, fret: number): void {
    if (isCorrect) {
      this.correct++;
    } else {
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

  positionStats(): Map<string, { correct: number; incorrect: number }> {
    return this.positionMap;
  }
}
```

**Step 4: Update existing stats tests to pass string/fret args**

The existing `stats.record(...)` calls in `tests/stats.test.ts` need string/fret added. Update them all to pass `'E', 0` as dummy values (the existing tests only check aggregate behavior):

```typescript
stats.record(true, 2.0, 'E', 0);
stats.record(true, 4.0, 'E', 0);
// etc.
```

**Step 5: Run tests**

```bash
npm test -- --testPathPattern stats
```
Expected: all pass.

**Step 6: Update call site in game.ts**

In `src/game.ts`, update the `stats.record(...)` call (currently line 94) to pass `stringName` and `fret`:

```typescript
stats.record(isCorrect, elapsedSeconds, stringName, fret);
```

**Step 7: Run all tests**

```bash
npm test
```
Expected: all pass.

**Step 8: Commit**

```bash
git add src/stats.ts src/game.ts tests/stats.test.ts
git commit -m "feat: track per-position (string/fret) stats for heatmap analysis"
```

---

### Task 4: Print weakest positions in end-of-session summary

**Files:**
- Modify: `src/game.ts`

**Step 1: Extract summary printing into a helper**

In `src/game.ts`, there are two identical summary blocks (SIGINT handler and `rl.once('close')`). Extract to a function to avoid duplication:

```typescript
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
```

Replace both `console.log` summary blocks with `printSummary(stats)`.

**Step 2: Run all tests**

```bash
npm test
```
Expected: all pass.

**Step 3: Commit**

```bash
git add src/game.ts
git commit -m "feat: print weakest positions in end-of-session summary"
```

---

### Task 5: Implement WeightMatrix

**Files:**
- Create: `src/weights.ts`
- Create: `tests/weights.test.ts`

**Step 1: Write failing tests**

Create `tests/weights.test.ts`:

```typescript
import { WeightMatrix } from '../src/weights';

describe('WeightMatrix', () => {
  it('initializes with uniform weights', () => {
    const wm = new WeightMatrix(['E', 'A'], 2);
    // 2 strings × 3 frets (0,1,2) = 6 positions
    const picked = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const { stringName, fret } = wm.pick();
      picked.add(`${stringName}:${fret}`);
    }
    // All 6 positions should appear with uniform sampling
    expect(picked.size).toBe(6);
  });

  it('increases weight on incorrect answer, clamped at 4.0', () => {
    const wm = new WeightMatrix(['E'], 0);
    wm.update('E', 0, false);
    wm.update('E', 0, false);
    wm.update('E', 0, false);
    wm.update('E', 0, false);
    wm.update('E', 0, false);
    // weight starts at 1.0, ×1.5 each wrong, clamped at 4.0
    expect(wm.getWeight('E', 0)).toBe(4.0);
  });

  it('decreases weight on correct answer, clamped at 0.5', () => {
    const wm = new WeightMatrix(['E'], 0);
    for (let i = 0; i < 10; i++) wm.update('E', 0, true);
    expect(wm.getWeight('E', 0)).toBe(0.5);
  });

  it('pick always returns a valid position', () => {
    const wm = new WeightMatrix(['G', 'B'], 3);
    for (let i = 0; i < 50; i++) {
      const { stringName, fret } = wm.pick();
      expect(['G', 'B']).toContain(stringName);
      expect(fret).toBeGreaterThanOrEqual(0);
      expect(fret).toBeLessThanOrEqual(3);
    }
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern weights
```
Expected: FAIL — `WeightMatrix` doesn't exist.

**Step 3: Implement WeightMatrix**

Create `src/weights.ts`:

```typescript
export class WeightMatrix {
  private weights: Map<string, number> = new Map();
  private positions: Array<{ stringName: string; fret: number }> = [];

  constructor(strings: string[], maxFret: number) {
    for (const stringName of strings) {
      for (let fret = 0; fret <= maxFret; fret++) {
        const key = `${stringName}:${fret}`;
        this.weights.set(key, 1.0);
        this.positions.push({ stringName, fret });
      }
    }
  }

  pick(): { stringName: string; fret: number } {
    const totalWeight = this.positions.reduce(
      (sum, p) => sum + this.weights.get(`${p.stringName}:${p.fret}`)!,
      0
    );
    let r = Math.random() * totalWeight;
    for (const p of this.positions) {
      r -= this.weights.get(`${p.stringName}:${p.fret}`)!;
      if (r <= 0) return p;
    }
    return this.positions[this.positions.length - 1];
  }

  update(stringName: string, fret: number, isCorrect: boolean): void {
    const key = `${stringName}:${fret}`;
    const current = this.weights.get(key) ?? 1.0;
    const next = isCorrect
      ? Math.max(0.5, current * 0.8)
      : Math.min(4.0, current * 1.5);
    this.weights.set(key, next);
  }

  getWeight(stringName: string, fret: number): number {
    return this.weights.get(`${stringName}:${fret}`) ?? 1.0;
  }
}
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern weights
```
Expected: all pass.

**Step 5: Commit**

```bash
git add src/weights.ts tests/weights.test.ts
git commit -m "feat: add WeightMatrix for weighted position selection"
```

---

### Task 6: Wire --smart flag into CLI and game loop

**Files:**
- Modify: `src/index.ts`
- Modify: `src/game.ts`

**Step 1: Add `smart` to GameOptions and index.ts**

In `src/game.ts`, add `smart: boolean` to `GameOptions`:

```typescript
export interface GameOptions {
  maxFret: number;
  strings: string[];
  fretboard: boolean;
  smart: boolean;
}
```

In `src/index.ts`, add the flag and pass it through:

```typescript
.option('--smart', 'Weight note selection toward weaker positions', false)
```

And in the `.action` callback:

```typescript
runGame({ maxFret, strings, fretboard: options.fretboard as boolean, smart: options.smart as boolean })
```

**Step 2: Use WeightMatrix in game loop**

In `src/game.ts`, import `WeightMatrix`:

```typescript
import { WeightMatrix } from './weights';
```

Before the `while (true)` loop, instantiate it when smart mode is on:

```typescript
const weightMatrix = options.smart ? new WeightMatrix(options.strings, options.maxFret) : null;
```

Replace the position selection inside the loop:

```typescript
let stringName: string;
let fret: number;
if (weightMatrix) {
  ({ stringName, fret } = weightMatrix.pick());
} else {
  stringName = options.strings[randomInt(0, options.strings.length - 1)];
  fret = randomInt(0, options.maxFret);
}
```

After `stats.record(...)`, add the weight update:

```typescript
if (weightMatrix) {
  weightMatrix.update(stringName, fret, isCorrect);
}
```

**Step 3: Run all tests**

```bash
npm test
```
Expected: all pass.

**Step 4: Commit**

```bash
git add src/index.ts src/game.ts
git commit -m "feat: add --smart flag for weighted note selection"
```

---

### Task 7: Build and verify

**Step 1: Compile**

```bash
npm run build
```
Expected: no TypeScript errors.

**Step 2: Run all tests**

```bash
npm test
```
Expected: all pass.

**Step 3: Commit build output**

```bash
git add dist/
git commit -m "build: compile notes-feedback features"
```
