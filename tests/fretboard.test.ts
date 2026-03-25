import { renderFretboard } from '../src/fretboard';

describe('renderFretboard', () => {
  it('returns 6 rows', () => {
    const output = renderFretboard(15, 'A', 5);
    const lines = output.split('\n').filter((l: string) => l.length > 0);
    expect(lines).toHaveLength(6);
  });

  it('each row starts with the nut glyph ‖ preceded by a space', () => {
    const lines = renderFretboard(15, 'A', 5)
      .split('\n').filter((l: string) => l.length > 0);
    for (const line of lines) {
      expect(line.startsWith(' ‖')).toBe(true);
    }
  });

  it('each row has maxFret+1 cells', () => {
    const maxFret = 15;
    const lines = renderFretboard(maxFret, 'A', 5)
      .split('\n').filter((l: string) => l.length > 0);
    for (const line of lines) {
      // cells separated by ' | ', so count pipes after nut glyph and space
      const afterNut = line.slice(2); // remove ‖ and the space after it
      const cells = afterNut.split('|');
      expect(cells).toHaveLength(maxFret);
    }
  });

  it('places X on correct string and fret', () => {
    // A string = index 1 from bottom → row index 4 from top (5 - 1)
    const lines = renderFretboard(15, 'A', 11)
      .split('\n').filter((l: string) => l.length > 0);
    // row 4 from top (0-indexed) is A string
    const afterNut = lines[4].slice(2); // remove ‖ and the space after it
    const cells = afterNut.split('|');
    expect(cells[10].trim()).toBe('-X-');
  });

  it('places ▼ on D string at fret 3', () => {
    // D string = index 2 from bottom → row index 3 from top
    const lines = renderFretboard(15, 'E', 0)
      .split('\n').filter((l: string) => l.length > 0);
    const dRow = lines[3];
    const cells = dRow.slice(2).split('|');
    expect(cells[2].trim()).toBe('▼');
  });

  it('places ▲ on G string at fret 5', () => {
    // G string = index 3 from bottom → row index 2 from top
    const lines = renderFretboard(15, 'E', 0)
      .split('\n').filter((l: string) => l.length > 0);
    const gRow = lines[2];
    const cells = gRow.slice(2).split('|');
    expect(cells[4].trim()).toBe('▲');
  });

  it('places ▼/▲ on both D and G string at fret 12 (double dot)', () => {
    const lines = renderFretboard(15, 'E', 0)
      .split('\n').filter((l: string) => l.length > 0);
    const dRow = lines[3];
    const gRow = lines[2];
    expect(dRow.slice(2).split('|')[11].trim()).toBe('▼');
    expect(gRow.slice(2).split('|')[11].trim()).toBe('▲');
  });

  it('X takes priority over ⏺ when target is on D string at fret 3', () => {
    // D string = index 2 from bottom → row index 3 from top
    const lines = renderFretboard(15, 'D', 3)
      .split('\n').filter((l: string) => l.length > 0);
    const dRow = lines[3];
    const cells = dRow.slice(2).split('|');
    expect(cells[2].trim()).toBe('-X-');
  });

  it('does not place ⏺ beyond maxFret', () => {
    // maxFret=8 — fret 9 (G string dot) should not appear
    const lines = renderFretboard(8, 'E', 0)
      .split('\n').filter((l: string) => l.length > 0);
    const gRow = lines[2];
    const cells = gRow.slice(2).split('|');
    // cells has length maxFret+1 = 9 (frets 0-8)
    expect(cells).toHaveLength(8);
    // verify no stray ⏺ beyond what's expected in range
    const inlayPositions = cells.map((c: string, i: number) => c.trim() === '▲' ? i : -1).filter((i: number) => i >= 0);
    expect(inlayPositions).toEqual([2, 4, 6]);
  });
});
