import * as fs from 'fs';

/**
 * Load weights from a JSON file. Returns an empty object if the file
 * does not exist or cannot be parsed — never throws.
 */
export function loadWeights(filePath: string): Record<string, number> {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn(`Warning: ${filePath} does not contain a JSON object. Starting with fresh weights.`);
      return {};
    }
    return parsed as Record<string, number>;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      // File exists but couldn't be read or parsed
      console.warn(`Warning: could not load weights from ${filePath}. Starting with fresh weights.`);
    }
    return {};
  }
}

/**
 * Save weights to a JSON file. Logs a warning on failure — never throws.
 */
export function saveWeights(filePath: string, weights: Record<string, number>): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(weights, null, 2), 'utf8');
  } catch (err: unknown) {
    console.warn(`Warning: could not save weights to ${filePath}: ${(err as Error).message}`);
  }
}
