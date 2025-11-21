const { describe, it, expect, beforeAll } = require('@jest/globals');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);
const CLI_PATH = path.join(process.cwd(), 'bin/lean-format.js');

describe('CLI Integration Tests', () => {
    let testDir;

    beforeAll(() => {
        testDir = path.join(process.cwd(), '__tests__', 'temp');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
    });

    describe('parse command', () => {
        it('should parse LEAN from file', async () => {
            const leanFile = path.join(testDir, 'test.lean');
            fs.writeFileSync(leanFile, 'name: Alice\nage: 30');

            const { stdout } = await execAsync(`node ${CLI_PATH} parse ${leanFile}`);
            const result = JSON.parse(stdout);

            expect(result).toEqual({ name: 'Alice', age: 30 });
        });

        it('should parse LEAN from stdin', async () => {
            const { stdout } = await execAsync(`echo "name: Bob\\nage: 25" | node ${CLI_PATH} parse`);
            const result = JSON.parse(stdout);

            expect(result).toEqual({ name: 'Bob', age: 25 });
        });

        it('should handle parse errors gracefully', async () => {
            const leanFile = path.join(testDir, 'invalid.lean');
            fs.writeFileSync(leanFile, 'invalid : : syntax');

            try {
                await execAsync(`node ${CLI_PATH} parse ${leanFile}`);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.stderr || error.stdout).toContain('Error parsing');
            }
        });
    });

    describe('format command', () => {
        it('should format JSON from file', async () => {
            const jsonFile = path.join(testDir, 'test.json');
            fs.writeFileSync(jsonFile, JSON.stringify({ name: 'Alice', age: 30 }));

            const { stdout } = await execAsync(`node ${CLI_PATH} format ${jsonFile}`);

            expect(stdout).toContain('name: Alice');
            expect(stdout).toContain('age: 30');
        });

        it('should format JSON from stdin', async () => {
            const { stdout } = await execAsync(`echo '{"name":"Bob","age":25}' | node ${CLI_PATH} format`);

            expect(stdout).toContain('name: Bob');
            expect(stdout).toContain('age: 25');
        });
    });

    describe('validate command', () => {
        it('should validate valid LEAN file', async () => {
            const leanFile = path.join(testDir, 'valid.lean');
            fs.writeFileSync(leanFile, 'name: Alice\nage: 30');

            const { stdout } = await execAsync(`node ${CLI_PATH} validate ${leanFile}`);

            expect(stdout).toContain('valid');
        });

        it('should detect invalid LEAN file', async () => {
            const leanFile = path.join(testDir, 'mixed-indent.lean');
            fs.writeFileSync(leanFile, 'name: Alice\n\tage: 30'); // Mixed spaces and tabs

            try {
                await execAsync(`node ${CLI_PATH} validate ${leanFile}`);
            } catch (error) {
                expect(error.stderr || error.stdout).toContain('invalid');
            }
        });
    });

    describe('convert command', () => {
        it('should convert LEAN to JSON', async () => {
            const leanFile = path.join(testDir, 'convert-test.lean');
            const jsonFile = path.join(testDir, 'convert-test.json');
            fs.writeFileSync(leanFile, 'name: Alice\nage: 30');

            await execAsync(`node ${CLI_PATH} convert ${leanFile} ${jsonFile}`);

            expect(fs.existsSync(jsonFile)).toBe(true);
            const result = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
            expect(result).toEqual({ name: 'Alice', age: 30 });

            // Cleanup
            fs.unlinkSync(jsonFile);
        });

        it('should convert JSON to LEAN', async () => {
            const jsonFile = path.join(testDir, 'convert-test2.json');
            const leanFile = path.join(testDir, 'convert-test2.lean');
            fs.writeFileSync(jsonFile, JSON.stringify({ name: 'Bob', age: 25 }));

            await execAsync(`node ${CLI_PATH} convert ${jsonFile} ${leanFile}`);

            expect(fs.existsSync(leanFile)).toBe(true);
            const content = fs.readFileSync(leanFile, 'utf8');
            expect(content).toContain('name:');
            expect(content).toContain('age:');

            // Cleanup
            fs.unlinkSync(leanFile);
        });
    });

    describe('init command', () => {
        it('should create sample LEAN file', async () => {
            const sampleFile = path.join(testDir, 'sample-cli.lean');

            await execAsync(`cd ${testDir} && node ${CLI_PATH} init sample-cli`);

            expect(fs.existsSync(sampleFile)).toBe(true);
            const content = fs.readFileSync(sampleFile, 'utf8');
            expect(content).toContain('project:');
            expect(content).toContain('users');

            // Cleanup
            fs.unlinkSync(sampleFile);
        });
    });
});
