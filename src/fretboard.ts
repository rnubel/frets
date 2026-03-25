// D string (STRINGS index 2) inlay frets
const D_INLAY_FRETS = new Set([3, 7, 12, 15, 19]);
// G string (STRINGS index 3) inlay frets
const G_INLAY_FRETS = new Set([5, 9, 12, 17, 21]);

const MARKER = '-X-';

/**
 * Renders an ASCII fretboard. Always renders all 6 standard EADGBE strings.
 *
 * @param maxFret - Highest fret to display (columns: 0..maxFret)
 * @param targetString - String name where X is placed. 'E' targets the low E string
 *   (bottom row), consistent with how the game selects strings.
 * @param targetFret - Fret number where X is placed
 * @returns Multi-line string, no trailing newline
 */
export function renderFretboard(
  maxFret: number,
  targetString: string,
  targetFret: number
): string {
  // Fixed EADGBE order; rows top-to-bottom = high E (5) down to low E (0)
  const STRING_ORDER = ['E', 'A', 'D', 'G', 'B', 'E']; // index 0 = low E

  // Find the row from top for the target string.
  // STRING_ORDER[0] = low E (bottom row), STRING_ORDER[5] = high E (top row).
  // We scan from index 0 upward, so 'E' resolves to low E (index 0), not high E.
  let targetRowFromTop = -1;
  for (let i = 0; i < STRING_ORDER.length; i++) {
    if (STRING_ORDER[i] === targetString) {
      targetRowFromTop = STRING_ORDER.length - 1 - i;
      break;
    }
  }

  const rows: string[] = [];
  for (let rowFromTop = 0; rowFromTop < STRING_ORDER.length; rowFromTop++) {
    const stringIndex = STRING_ORDER.length - 1 - rowFromTop; // 5 down to 0
    const cells: string[] = [];
    var nut;
    
    if (rowFromTop == targetRowFromTop && targetFret == 0) {
      nut = MARKER;
    } else {
      nut = ' ‖';
    }

    for (let fret = 1; fret <= maxFret; fret++) {
      if (rowFromTop === targetRowFromTop && fret === targetFret) {
        cells.push(MARKER);
      } else if (stringIndex === 2 && D_INLAY_FRETS.has(fret)) {
        cells.push(' ⏺ ');
      } else if (stringIndex === 3 && G_INLAY_FRETS.has(fret)) {
        cells.push(' ⏺ ');
      } else {
        cells.push('   ');
      }
    }

    if (nut === MARKER) {
      cells[0] = '  ';
    }

    rows.push(nut + cells.join('|'));
  }

  return rows.join('\n');
}
