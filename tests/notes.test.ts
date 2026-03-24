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
