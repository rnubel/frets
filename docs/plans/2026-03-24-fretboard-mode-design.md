# Fretboard Mode Design

## Overview

Add a `--fretboard` flag that replaces the text prompt ("String: E  Fret: 11") with an ASCII fretboard display. The quiz mechanic is identical: a random string/fret is chosen, the player types the note name, scoring and stats are unchanged.

## Architecture

### New module: `src/fretboard.ts`

One exported pure function:

```ts
renderFretboard(
  strings: string[],
  maxFret: number,
  targetString: string,
  targetFret: number
): string
```

Returns a multi-line string. Pure and side-effect-free — easy to unit test.

### Changes to `src/game.ts`

`GameOptions` gains `fretboard: boolean`. The prompt line switches on it:

```ts
// text mode (existing)
chalk.cyan(`String: ${stringName}`) + '  ' + chalk.yellow(`Fret: ${fret}`) + ' > '

// fretboard mode (new)
renderFretboard(options.strings, options.maxFret, stringName, fret) + '\n> '
```

Everything else (input parsing, timing, stats, SIGINT/EOF) is unchanged.

### Changes to `src/index.ts`

Add `.option('--fretboard', 'Show ASCII fretboard instead of text prompt')` and pass `fretboard: !!options.fretboard` into `runGame`.

### New tests: `tests/fretboard.test.ts`

Unit tests for `renderFretboard` covering layout, inlay placement, X placement, and X-over-inlay priority.

## Fretboard Renderer Spec

### Layout

```
‖ | | | | | | | | | | |X| | | |   ← high E (string index 5, top row)
‖ | | | | | | | | | | | | | | |   ← B   (string index 4)
‖ | | | |⏺| | | |⏺| | |⏺| | | |   ← G   (string index 3)
‖ | |⏺| | | |⏺| | | | |⏺| | |⏺|  ← D   (string index 2)
‖ | | | | | | | | | | | | | | |   ← A   (string index 1)
‖ | | | | | | | | | | | | | | |   ← low E (string index 0, bottom row)
```

- Rows: top = high E (STRINGS index 5), bottom = low E (STRINGS index 0)
- `‖` is the nut, followed by fret cells 0 through maxFret
- Each fret cell is one character wide, separated by ` | `
- Cell contents (in priority order): `X` (target), `⏺` (inlay), ` ` (empty)

### Inlay marker positions

Dots alternate between the D string (3rd from bottom, STRINGS index 2) and G string (4th from bottom, STRINGS index 3), mimicking real staggered side-dot inlays:

| Dot # | Fret | String |
|-------|------|--------|
| 1     | 3    | D      |
| 2     | 5    | G      |
| 3     | 7    | D      |
| 4     | 9    | G      |
| 5     | 12   | D + G  |  ← double dot
| 6     | 15   | D      |
| 7     | 17   | G      |
| 8     | 19   | D      |
| 9     | 21   | G      |

Only inlays within `0..maxFret` are rendered. `X` takes priority over `⏺` when they coincide.

### Rendering with non-standard `--strings`

`renderFretboard` receives the active `strings` array. The D/G inlay rows are identified by position in the full EADGBE set (indices 2 and 3), not by what strings the user is drilling. The fretboard always renders all 6 standard string rows regardless of which strings are being quizzed — the `--strings` option only affects which strings get picked for questions.
