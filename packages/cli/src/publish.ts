import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { createHash } from 'node:crypto';

interface PublishOptions {
  registry?: string;
  quiet?: boolean;
  force?: boolean;
}

interface PackageManifest {
  name: string;
  version: string;
  description?: string;
  files: string[];
  hash: string;
  publishedAt: string;
}

export async function publishCommand(files: string[], opts: PublishOptions = {}): Promise<void> {
  const registryDir = opts.registry
    ? resolve(opts.registry)
    : resolve(process.cwd(), '.lean-registry');

  mkdirSync(registryDir, { recursive: true });

  const manifest: PackageManifest = {
    name: '',
    version: '1.0.0',
    files: [],
    hash: '',
    publishedAt: new Date().toISOString(),
  };

  const published: string[] = [];

  if (files.length === 0) {
    const leanFiles = readdirSync(process.cwd()).filter(f => f.endsWith('.lean'));
    if (leanFiles.length === 0) {
      console.error('No .lean files found to publish.');
      process.exit(1);
    }
    files = leanFiles;
  }

  const hash = createHash('sha256');

  for (const file of files) {
    if (!existsSync(file)) {
      console.error(`File not found: ${file}`);
      continue;
    }

    const content = readFileSync(file, 'utf-8');
    hash.update(content);

    const targetName = file.replace(/\.lean$/, '.lean');
    const targetPath = join(registryDir, targetName);

    if (!opts.force && existsSync(targetPath)) {
      const existing = readFileSync(targetPath, 'utf-8');
      if (existing !== content) {
        console.error(`Conflict: ${targetName} differs in registry. Use --force to overwrite.`);
        continue;
      }
    }

    mkdirSync(registryDir, { recursive: true });
    writeFileSync(targetPath, content);

    manifest.files.push(targetName);
    published.push(targetName);

    if (!opts.quiet) console.log(`Published: ${targetName} → ${registryDir}`);
  }

  if (published.length === 0) {
    console.error('Nothing published.');
    process.exit(1);
  }

  manifest.hash = hash.digest('hex');
  manifest.name = files.map(f => f.replace(/\.lean$/, '')).join('+');
  writeFileSync(join(registryDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  if (!opts.quiet) {
    console.log(`\nPublished ${published.length} file(s) to ${registryDir}`);
    console.log(`Manifest: ${join(registryDir, 'manifest.json')}`);
    console.log(`To pull:  lean pull ${registryDir}`);
  }
}

export async function pullCommand(registryPath: string, opts: { quiet?: boolean; force?: boolean } = {}): Promise<void> {
  const registryDir = resolve(registryPath);

  if (!existsSync(registryDir)) {
    console.error(`Registry not found: ${registryDir}`);
    process.exit(1);
  }

  const manifestPath = join(registryDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`No manifest.json found in ${registryDir}`);
    process.exit(1);
  }

  const manifest: PackageManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  let pulled = 0;

  for (const file of manifest.files) {
    const sourcePath = join(registryDir, file);
    const targetPath = resolve(process.cwd(), file);

    if (!opts.force && existsSync(targetPath)) {
      const existing = readFileSync(targetPath, 'utf-8');
      const source = readFileSync(sourcePath, 'utf-8');
      if (existing !== source) {
        console.error(`Conflict: ${file} exists locally with different content. Use --force to overwrite.`);
        continue;
      }
    }

    const content = readFileSync(sourcePath, 'utf-8');
    writeFileSync(targetPath, content);
    pulled++;

    if (!opts.quiet) console.log(`Pulled: ${file} → ${process.cwd()}`);
  }

  if (!opts.quiet) console.log(`\nPulled ${pulled}/${manifest.files.length} file(s) from ${registryDir}`);
}
