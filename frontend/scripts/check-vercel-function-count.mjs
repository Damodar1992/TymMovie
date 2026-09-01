import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOBBY_LIMIT = 12;
const apiRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../api');

function countDeployableApiFunctions(dir) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const rel = path.relative(apiRoot, fullPath).replace(/\\/g, '/');
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry.startsWith('_')) continue;
      const nested = countDeployableApiFunctions(fullPath);
      files.push(...nested.files);
      continue;
    }

    if (!/\.(t|j)sx?$/.test(entry)) continue;
    if (entry.startsWith('_')) continue;
    files.push(rel);
  }

  return { count: files.length, files };
}

const { count, files } = countDeployableApiFunctions(apiRoot);

console.log(`Vercel Serverless Functions under api/: ${count} / ${HOBBY_LIMIT}`);

for (const file of files) {
  console.log(`  - api/${file}`);
}

if (count > HOBBY_LIMIT) {
  console.error(
    `\nToo many API functions for Vercel Hobby (${count} > ${HOBBY_LIMIT}). ` +
      'Use api/index.ts with handlers in api/_routes/.',
  );
  process.exit(1);
}

console.log(`Within the Hobby ${HOBBY_LIMIT}-function limit.`);
