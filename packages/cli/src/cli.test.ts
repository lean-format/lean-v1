import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, readFileSync, rmSync, readdirSync } from 'fs';
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
  const opts: any = { encoding: 'utf-8', timeout: 15000 };
  if (input) {
    return execSync(`echo ${JSON.stringify(input)} | node ${cliDist} ${args}`, opts);
  }
  return execSync(`node ${cliDist} ${args}`, opts);
};

const itSkip = cliAvailable ? it : it.skip;

describe('CLI Integration Tests', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'lean-cli-test-'));
  });

  afterEach(() => {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  describe('parse', () => {
    itSkip('parses a .lean file and outputs JSON', () => {
      writeFileSync(join(tmpDir, 'test.lean'), 'name: Alice\nage: 30');
      const stdout = runCli(`parse --quiet ${join(tmpDir, 'test.lean')}`);
      expect(JSON.parse(stdout)).toEqual({ name: 'Alice', age: 30 });
    });

    itSkip('parses from stdin', () => {
      const stdout = runCli('parse --quiet', 'name: Alice\nage: 30');
      expect(JSON.parse(stdout)).toEqual({ name: 'Alice', age: 30 });
    });

    itSkip('fails gracefully on invalid LEAN', () => {
      writeFileSync(join(tmpDir, 'invalid.lean'), 'invalid :: syntax');
      expect(() => runCli(`parse --quiet ${join(tmpDir, 'invalid.lean')}`)).toThrow();
    });
  });

  describe('format', () => {
    itSkip('formats JSON to LEAN', () => {
      const stdout = runCli('format', JSON.stringify({ name: 'Alice', age: 30 }));
      expect(stdout).toContain('name: Alice');
      expect(stdout).toContain('age: 30');
    });

    itSkip('formats from a JSON file', () => {
      writeFileSync(join(tmpDir, 'test.json'), JSON.stringify({ name: 'Alice' }));
      const stdout = runCli(`format ${join(tmpDir, 'test.json')}`);
      expect(stdout).toContain('name: Alice');
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

  describe('compile', () => {
    itSkip('compiles LEAN to JSON', () => {
      writeFileSync(join(tmpDir, 'data.lean'), 'name: Alice\nage: 30');
      runCli(`compile --format json --quiet ${join(tmpDir, 'data.lean')}`);
      expect(existsSync(join(tmpDir, 'data.json'))).toBe(true);
      expect(JSON.parse(readFileSync(join(tmpDir, 'data.json'), 'utf-8'))).toEqual({ name: 'Alice', age: 30 });
    });

    itSkip('compiles LEAN to YAML', () => {
      writeFileSync(join(tmpDir, 'data.lean'), 'name: Alice\nage: 30');
      runCli(`compile --format yaml --quiet ${join(tmpDir, 'data.lean')}`);
      expect(existsSync(join(tmpDir, 'data.yaml'))).toBe(true);
    });

    itSkip('compiles LEAN to ENV', () => {
      writeFileSync(join(tmpDir, 'data.lean'), 'name: Alice\nage: 30');
      runCli(`compile --format env --quiet ${join(tmpDir, 'data.lean')}`);
      expect(existsSync(join(tmpDir, 'data.env'))).toBe(true);
      const env = readFileSync(join(tmpDir, 'data.env'), 'utf-8');
      expect(env).toContain('NAME=');
      expect(env).toContain('AGE=');
    });

    itSkip('compiles multiple formats at once', () => {
      writeFileSync(join(tmpDir, 'data.lean'), 'name: Alice');
      runCli(`compile --format json,yaml --quiet ${join(tmpDir, 'data.lean')}`);
      expect(existsSync(join(tmpDir, 'data.json'))).toBe(true);
      expect(existsSync(join(tmpDir, 'data.yaml'))).toBe(true);
    });

    itSkip('rejects existing file without --force', () => {
      writeFileSync(join(tmpDir, 'data.lean'), 'name: Alice');
      writeFileSync(join(tmpDir, 'data.json'), '{}');
      expect(() => runCli(`compile --format json --quiet ${join(tmpDir, 'data.lean')}`)).toThrow();
    });

    itSkip('overwrites with --force', () => {
      writeFileSync(join(tmpDir, 'data.lean'), 'name: Alice');
      writeFileSync(join(tmpDir, 'data.json'), '{}');
      runCli(`compile --format json --force --quiet ${join(tmpDir, 'data.lean')}`);
      expect(JSON.parse(readFileSync(join(tmpDir, 'data.json'), 'utf-8'))).toEqual({ name: 'Alice' });
    });
  });

  describe('diff', () => {
    itSkip('shows diff between two files', () => {
      writeFileSync(join(tmpDir, 'a.lean'), 'name: Alice\nage: 30');
      writeFileSync(join(tmpDir, 'b.lean'), 'name: Alice\nage: 31');
      const stdout = runCli(`diff ${join(tmpDir, 'a.lean')} ${join(tmpDir, 'b.lean')}`);
      expect(stdout).toContain('age');
    });

    itSkip('reports identical files', () => {
      writeFileSync(join(tmpDir, 'a.lean'), 'name: Alice');
      writeFileSync(join(tmpDir, 'b.lean'), 'name: Alice');
      const stdout = runCli(`diff ${join(tmpDir, 'a.lean')} ${join(tmpDir, 'b.lean')}`);
      expect(stdout).toContain('identical');
    });
  });

  describe('query', () => {
    itSkip('extracts a value by path', () => {
      writeFileSync(join(tmpDir, 'test.lean'), 'user:\n  name: Alice\n  age: 30');
      const stdout = runCli(`query ${join(tmpDir, 'test.lean')} user.name`);
      expect(JSON.parse(stdout)).toBe('Alice');
    });

    itSkip('reports missing path', () => {
      writeFileSync(join(tmpDir, 'test.lean'), 'name: Alice');
      expect(() => runCli(`query ${join(tmpDir, 'test.lean')} missing.path`)).toThrow();
    });
  });

  describe('schema', () => {
    itSkip('generates JSON Schema', () => {
      writeFileSync(join(tmpDir, 'test.lean'), 'name: Alice\nage: 30');
      const stdout = runCli(`schema ${join(tmpDir, 'test.lean')} --quiet`);
      const schema = JSON.parse(stdout);
      expect(schema).toHaveProperty('type');
      expect(schema).toHaveProperty('properties');
    });
  });

  describe('init', () => {
    itSkip('creates a sample .lean file', () => {
      const filePath = join(tmpDir, 'sample.lean');
      runCli(`init ${filePath}`);
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('Sample LEAN');
    });
  });

  describe('sql', () => {
    itSkip('queries .lean data with SQL', () => {
      writeFileSync(join(tmpDir, 'data.lean'), `users(id, name, role):
    - 1, Alice, admin
    - 2, Bob, user`);
      const stdout = runCli(`sql "SELECT name FROM users" ${join(tmpDir, 'data.lean')}`);
      const result = JSON.parse(stdout);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
    });

    itSkip('outputs LEAN format', () => {
      writeFileSync(join(tmpDir, 'data.lean'), `users(id, name):
    - 1, Alice`);
      const stdout = runCli(`sql "SELECT * FROM users" ${join(tmpDir, 'data.lean')} --format lean`);
      expect(stdout).toContain('data(');
      expect(stdout).toContain('Alice');
    });

    itSkip('handles complex queries', () => {
      writeFileSync(join(tmpDir, 'data.lean'), `users(id, name, role, active):
    - 1, Alice, admin, true
    - 2, Bob, user, false
    - 3, Casey, admin, true`);
      const stdout = runCli(`sql "SELECT name FROM users WHERE role = 'admin' AND active = 'true'" ${join(tmpDir, 'data.lean')}`);
      const result = JSON.parse(stdout);
      expect(result.map((r: any) => r.name).sort()).toEqual(['Alice', 'Casey']);
    });
  });

  describe('fuzz', () => {
    itSkip('runs fuzz tests with quiet JSON output', () => {
      const stdout = runCli('fuzz -n 100 -q');
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('iterations', 100);
      expect(result).toHaveProperty('failures');
      expect(result).toHaveProperty('seed');
    });

    itSkip('uses provided seed', () => {
      const stdout = runCli('fuzz -n 50 -q --seed 42');
      const result = JSON.parse(stdout);
      expect(result.seed).toBe(42);
    });
  });

  describe('migrate', () => {
    itSkip('create creates a migration file', () => {
      const migrateDir = join(tmpDir, 'migrations');
      mkdirSync(tmpDir, { recursive: true });
      runCli(`migrate create add_users --dir ${tmpDir} -q`);
      const files = readdirSync(migrateDir);
      expect(files.length).toBeGreaterThan(0);
      const file = files[0];
      expect(file).toContain('add_users');
      expect(file).toMatch(/\.lean$/);
    });

    itSkip('status shows no migrations when empty', () => {
      const stdout = runCli(`migrate status --dir ${tmpDir}`);
      expect(stdout).toContain('No migrations');
    });

    itSkip('create and status shows pending migration', () => {
      runCli(`migrate create test_migration --dir ${tmpDir} -q`);
      const stdout = runCli(`migrate status --dir ${tmpDir}`);
      expect(stdout).toContain('test_migration');
    });
  });

  describe('stdin piped input', () => {
    itSkip('parse reads from stdin', () => {
      const stdout = runCli('parse --quiet', 'key: value\nnested:\n  inner: 42');
      expect(JSON.parse(stdout)).toEqual({ key: 'value', nested: { inner: 42 } });
    });

    itSkip('format reads from stdin', () => {
      const stdout = runCli('format --quiet', JSON.stringify({ key: 'value' }));
      expect(stdout).toContain('key: value');
    });

    itSkip('validate reads from stdin', () => {
      const stdout = runCli('validate --quiet', 'key: value');
      expect(stdout).toContain('valid');
    });
  });

  describe('help output', () => {
    itSkip('--help shows commands', () => {
      const stdout = runCli('--help');
      expect(stdout).toContain('parse');
      expect(stdout).toContain('format');
      expect(stdout).toContain('validate');
      expect(stdout).toContain('compile');
      expect(stdout).toContain('diff');
      expect(stdout).toContain('query');
      expect(stdout).toContain('schema');
      expect(stdout).toContain('init');
      expect(stdout).toContain('sql');
      expect(stdout).toContain('watch');
      expect(stdout).toContain('fuzz');
      expect(stdout).toContain('migrate');
    });
  });
});
