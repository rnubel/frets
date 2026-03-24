// D string (STRINGS index 2) inlay frets
const D_INLAY_FRETS = new Set([3, 7, 12, 15, 19]);
// G string (STRINGS index 3) inlay frets
const G_INLAY_FRETS = new Set([5, 9, 12, 17, 21]);

/**
 * Renders an ASCII fretboard.
 *
 * @param _strings - The full 6-string array (used only for row count; always renders EADGBE order)
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
