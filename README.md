# frets

A terminal-based guitar fretboard trainer. Drills you on note positions across the neck with adaptive weighting (the notes you miss appear more often; the notes you get right appear less often).

```
npx @rnubel/frets

🎸 Frets — Fretboard Trainer
Type the note name (e.g. G#, Bb, F). Ctrl+C to quit.

 ‖   |   |   |   |   |   |   |   |   |   |   |   |   |   |   
 ‖   |   |   |   |   |   |   |   |   |   |   |   |   |   |   
 ‖   |   |   |   | ⏺ |   |   |   |-X-|   |   | ⏺ |   |   |   
 ‖   |   | ⏺ |   |   |   | ⏺ |   |   |   |   | ⏺ |   |   | ⏺ 
 ‖   |   |   |   |   |   |   |   |   |   |   |   |   |   |   
 ‖   |   |   |   |   |   |   |   |   |   |   |   |   |   |   
> E
  ✓ Correct! (4.9s)
  Score: 1/1 (100%) | Avg: 4.9s
```

See [#usage](#usage) for more options and customizations.

## Requirements

- Node.js 20+

## Installation

You can run this directly with `npx`:

```bash
npx @rnubel/frets
```

Or, build from source and run:

```bash
git clone https://github.com/rnubel/frets.git
cd frets
npm install
npm run build
```

Then run it:

```bash
node dist/index.js
```

Or run without building (uses `ts-node`):

```bash
npm start
```

## Usage

```bash
npx @rnubel/frets [options]
node dist/index.js [options]
```

| Option | Default | Description |
|---|---|---|
| `--max-fret <n>` | `15` | Highest fret to include (0–24) |
| `--strings <list>` | `E,A,D,G,B,E` | Comma-separated list of strings to drill |
| `--fretboard` | `true` | Show ASCII fretboard diagram instead of a text prompt |
| `--smart` | `true` | Adaptively weight positions toward your weak spots |
| `--debug` | `false` | Print the full weight matrix after each answer |

**Examples:**

```bash
# Drill only the low strings up to fret 12
node dist/index.js --strings E,A,D --max-fret 12

# Text-only prompts, no fretboard diagram
node dist/index.js --no-fretboard

# Disable adaptive weighting
node dist/index.js --no-smart
```

Press `Ctrl+C` at any time to end the session and see your summary.

## How it works

In smart mode, each string/fret position has a weight that starts at 1×. An incorrect answer raises the weight up to 4×, making that position appear proportionally more often. A correct answer lowers the weight toward 0.5×, with the reduction scaled by response time — slow correct answers don't reduce the weight as aggressively as fast ones.

## License

Free use.
