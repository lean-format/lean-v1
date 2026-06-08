import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const CLI = resolve('dist/index.js');
const TMP = join(process.cwd(), '__tests__', 'temp');

describe('CLI Integration Tests', () => {
  beforeAll(() => {
    if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true });
  });

  const run = (args, input) => {
    const opts = { cwd: TMP, encoding: 'utf-8' };
    if (input) {
      const result = execSync(`echo ${JSON.stringify(input)} | node ${CLI} ${args}`, opts);
      return result;
    }
    return execSync(`node ${CLI} ${args}`, opts);
  };

  describe('parse', () => {
    it('parses LEAN from file', () => {
      writeFileSync(join(TMP, 'test.lean'), 'name: Alice\nage: 30');
      const stdout = execSync(`node ${CLI} parse ${join(TMP, 'test.lean')}`, { encoding: 'utf-8' });
      expect(JSON.parse(stdout)).toEqual({ name: 'Alice', age: 30 });
    });

    it('parses LEAN from stdin', () => {
      const stdout = execSync(`echo "name: Bob\\nage: 25" | node ${CLI} parse`, { encoding: 'utf-8' });
      expect(JSON.parse(stdout)).toEqual({ name: 'Bob', age: 25 });
    });

    it('handles parse errors', () => {
      writeFileSync(join(TMP, 'invalid.lean'), 'invalid :: syntax');
      try {
        execSync(`node ${CLI} parse ${join(TMP, 'invalid.lean')}`, { encoding: 'utf-8' });
      } catch (e) {
        expect(e.stderr || e.stdout).toBeTruthy();
      }
    });
  });

  describe('format', () => {
    it('formats JSON from file', () => {
      writeFileSync(join(TMP, 'test.json'), JSON.stringify({ name: 'Alice', age: 30 }));
      const stdout = execSync(`node ${CLI} format ${join(TMP, 'test.json')}`, { encoding: 'utf-8' });
      expect(stdout).toContain('name: Alice');
      expect(stdout).toContain('age: 30');
    });
  });

  describe('validate', () => {
    it('validates valid LEAN', () => {
      writeFileSync(join(TMP, 'valid.lean'), 'name: Alice\nage: 30');
      const stdout = execSync(`node ${CLI} validate ${join(TMP, 'valid.lean')}`, { encoding: 'utf-8' });
      expect(stdout).toContain('valid');
    });
  });
});
