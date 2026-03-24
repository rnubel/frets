// Chromatic scale using sharps as canonical form
// Index 0 = C, 1 = C#, 2 = D, 3 = D#, 4 = E, 5 = F, 6 = F#,
//        7 = G, 8 = G#, 9 = A, 10 = A#, 11 = B
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Standard guitar tuning: low E to high E
export const STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'] as const;
export type StringName = typeof STRINGS[number];

const OPEN_NOTES: number[] = [4, 9, 2, 7, 11, 4]; // E A D G B E (semitone indices)

// Map note letters to semitone base values
const NOTE_MAP: Record<string, number> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11
};

/** Returns the canonical note name (using sharps) for a given string and fret.
 * @param stringName - One of 'E', 'A', 'D', 'G', 'B' (standard EADGBE tuning; both E strings are treated identically)
 * @param fret - Non-negative integer fret number
 */
export function noteAtFret(stringName: string, fret: number): string {
  if (!Number.isInteger(fret) || fret < 0) {
    throw new Error(`Fret must be a non-negative integer, got: ${fret}`);
  }
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

  // Try formats: "g#", "gb", "g sharp", "g flat", "g"
  const match = trimmed.match(/^([a-g])\s*(#|b|sharp|flat)?$/);
  if (!match) return null;

  const letter = match[1];
  const modifier = match[2] ?? '';

  let semitone = NOTE_MAP[letter];

  if (modifier === '#' || modifier === 'sharp') {
    semitone = (semitone + 1) % 12;
  } else if (modifier === 'b' || modifier === 'flat') {
    semitone = (semitone + 11) % 12; // subtract 1 with wrap
  }

  return semitone;
}
