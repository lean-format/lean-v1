import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const cliDist = (() => {
  const root = process.cwd();
  const candidates = [
    join(root, 'packages', 'cli', 'dist', 'index.js'),
    join(root, '..', 'cli', 'dist', 'index.js'),
  ];
  return candidates.find(existsSync) ?? candidates[0];
})();
const cliAvailable = existsSync(cliDist);

const runCli = (args: string, input?: string): string => {
  const opts: any = { encoding: 'utf-8', timeout: 10000 };
  if (input) {
    return execSync(`echo ${JSON.stringify(input)} | node ${cliDist} ${args}`, opts);
  }
  return execSync(`node ${cliDist} ${args}`, opts);
};

const itSkip = cliAvailable ? it : it.skip;

describe('CLI E2E', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'lean-cli-test-'));
  });

  afterEach(() => {
    try {
      const files = ['test.lean', 'test.json', 'valid.lean', 'invalid.lean', 'a.lean', 'b.lean', 'sample.lean', 'output.json'];
      for (const f of files) {
        const fp = join(tmpDir, f);
        if (existsSync(fp)) unlinkSync(fp);
      }
    } catch {
      // ignore cleanup errors
    }
  });

  describe('parse', () => {
    itSkip('parses a .lean file and outputs JSON', () => {
      writeFileSync(join(tmpDir, 'test.lean'), 'name: Alice\nage: 30');
      const stdout = runCli(`parse --quiet ${join(tmpDir, 'test.lean')}`);
      expect(JSON.parse(stdout)).toEqual({ name: 'Alice', age: 30 });
    });

    itSkip('fails gracefully on invalid LEAN', () => {
      writeFileSync(join(tmpDir, 'invalid.lean'), 'invalid :: syntax');
      expect(() => runCli(`parse --quiet ${join(tmpDir, 'invalid.lean')}`)).toThrow();
    });
  });

  describe('format', () => {
    itSkip('formats a JSON file to LEAN', () => {
      writeFileSync(join(tmpDir, 'test.json'), JSON.stringify({ name: 'Alice', age: 30 }));
      const stdout = runCli(`format ${join(tmpDir, 'test.json')}`);
      expect(stdout).toContain('name: Alice');
      expect(stdout).toContain('age: 30');
    });
  });

  describe('validate', () => {
    itSkip('exits with code 0 for valid LEAN', () => {
      writeFileSync(join(tmpDir, 'valid.lean'), 'name: Alice\nage: 30');
      const stdout = runCli(`validate ${join(tmpDir, 'valid.lean')}`);
      expect(stdout).toContain('valid');
    });

    itSkip('exits with code 1 for invalid LEAN', () => {
      writeFileSync(join(tmpDir, 'invalid.lean'), 'invalid :: syntax');
      expect(() => runCli(`validate ${join(tmpDir, 'invalid.lean')}`)).toThrow();
    });
  });

  describe('init', () => {
    itSkip('creates a sample .lean file', () => {
      const filePath = join(tmpDir, 'sample.lean');
      runCli(`init ${filePath}`);
      const content = existsSync(filePath);
      expect(content).toBe(true);
    });
  });

  describe('diff', () => {
    itSkip('shows diff between two files', () => {
      writeFileSync(join(tmpDir, 'a.lean'), 'name: Alice\nage: 30');
      writeFileSync(join(tmpDir, 'b.lean'), 'name: Alice\nage: 31');
      const stdout = runCli(`diff ${join(tmpDir, 'a.lean')} ${join(tmpDir, 'b.lean')}`);
      expect(stdout).toContain('age');
    });
  });

  describe('query', () => {
    itSkip('extracts a value by path', () => {
      writeFileSync(join(tmpDir, 'test.lean'), 'user:\n  name: Alice\n  age: 30');
      const stdout = runCli(`query ${join(tmpDir, 'test.lean')} user.name`);
      expect(JSON.parse(stdout)).toBe('Alice');
    });
  });
});
