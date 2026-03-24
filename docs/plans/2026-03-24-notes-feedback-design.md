# Design: NOTES.md Feedback

Date: 2026-03-24

## Overview

Three improvements sourced from NOTES.md:

1. Fix backspace erasing string/fret label in text mode
2. Per-position stats (string + fret) to enable heatmap analysis
3. `--smart` flag for weighted note selection based on session performance

---

## 1. Backspace Bug Fix

**Problem:** In text mode, the prompt puts string/fret info and `> ` on the same line. When the user presses backspace, readline erases characters from that line, including the string/fret label.

**Fix:** Split the text-mode first prompt into two lines — the string/fret info on its own line, then `> ` alone on the input line. The retry prompt (already just `> `) requires no change.

**Before:**
```
String: E  Fret: 5 > 
```

**After:**
```
String: E  Fret: 5
> 
```

**Files changed:** `src/game.ts` (first prompt construction only).

---

## 2. Per-Position Stats

**Goal:** Track correct/incorrect counts per `(string, fret)` pair to support heatmap analysis.

**Changes to `Stats` class (`src/stats.ts`):**

- Add `private positionMap: Map<string, { correct: number, incorrect: number }>`
- Change `record` signature to `record(isCorrect: boolean, responseTimeSeconds: number, stringName: string, fret: number)`
- Key format: `"${stringName}:${fret}"` (e.g. `"E:5"`)
- New method `positionStats(): Map<string, { correct: number, incorrect: number }>` returns the map

**End-of-session summary in `game.ts`:**

Print the 3–5 weakest positions (lowest accuracy) among positions attempted more than once, e.g.:
```
  Weakest positions:
    E:3   1/3  (33%)
    A:7   2/5  (40%)
```

**Files changed:** `src/stats.ts`, `src/game.ts`, `tests/stats.test.ts`.

---

## 3. `--smart` Flag

**Goal:** Bias note selection toward positions the user is weaker on, per session.

### WeightMatrix (`src/weights.ts`)

A new class initialized with all `(string, fret)` combinations active in the session.

```
Initial weight: 1.0 for every (string, fret)
```

**Selection:** weighted random — pick a position proportional to its current weight.

**Update rule (multiplicative):**
- Incorrect answer: `weight *= 1.5`, clamped to max `4.0`
- Correct answer: `weight *= 0.8`, clamped to min `0.5`

**API:**
```typescript
class WeightMatrix {
  constructor(strings: string[], maxFret: number)
  pick(): { stringName: string, fret: number }
  update(stringName: string, fret: number, isCorrect: boolean): void
}
```

### CLI (`src/index.ts`)

Add `--smart` boolean flag, default `false`. Pass through `GameOptions`.

### Game loop (`src/game.ts`)

- When `options.smart === true`, use `WeightMatrix.pick()` for selection instead of `randomInt`
- Call `WeightMatrix.update()` after each answered question
- `WeightMatrix` is instantiated once at game start with `options.strings` and `options.maxFret`

**Files changed:** `src/weights.ts` (new), `src/index.ts`, `src/game.ts`, `tests/weights.test.ts` (new).

---

## Testing

- `stats.test.ts`: extend existing tests to pass string/fret args; add per-position tracking tests
- `weights.test.ts`: new test file covering initialization, update clamping, and weighted selection distribution
