import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadWeights, saveWeights } from '../src/persistence';

describe('persistence', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frets-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loadWeights returns empty object when file does not exist', () => {
    const result = loadWeights(path.join(tmpDir, 'nonexistent.json'));
    expect(result).toEqual({});
  });

  it('loadWeights returns parsed weights from a valid JSON file', () => {
    const file = path.join(tmpDir, 'weights.json');
    fs.writeFileSync(file, JSON.stringify({ 'E:0': 1.5, 'A:3': 2.1 }));
    const result = loadWeights(file);
    expect(result['E:0']).toBeCloseTo(1.5);
    expect(result['A:3']).toBeCloseTo(2.1);
  });

  it('loadWeights returns empty object on malformed JSON', () => {
    const file = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(file, 'this is not json {{{');
    const result = loadWeights(file);
    expect(result).toEqual({});
  });

  it('saveWeights writes valid JSON to the specified file', () => {
    const file = path.join(tmpDir, 'out.json');
    saveWeights(file, { 'E:0': 1.2, 'G:7': 0.8 });
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed['E:0']).toBeCloseTo(1.2);
    expect(parsed['G:7']).toBeCloseTo(0.8);
  });

  it('saveWeights does not throw when write fails', () => {
    // Attempt to write to a directory path (which will fail)
    const dirPath = tmpDir; // tmpDir is a directory, not a file
    expect(() => saveWeights(dirPath, { 'E:0': 1.0 })).not.toThrow();
  });

  it('saveWeights round-trips: save then load returns same values', () => {
    const file = path.join(tmpDir, 'roundtrip.json');
    const weights = { 'E:0': 1.5, 'B:12': 3.2 };
    saveWeights(file, weights);
    const loaded = loadWeights(file);
    expect(loaded['E:0']).toBeCloseTo(1.5);
    expect(loaded['B:12']).toBeCloseTo(3.2);
  });
});
