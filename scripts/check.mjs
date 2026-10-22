import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['js/config.js', 'js/puzzles.js', 'js/save.js', 'js/puzzle-ui.js', 'js/app.js', 'scripts/serve.mjs', 'scripts/create-placeholders.mjs', 'scripts/check.mjs', 'scripts/check-puzzles.mjs', 'scripts/check-save.mjs'];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`JavaScript syntax: all ${files.length} files passed.`);
const puzzles = spawnSync(process.execPath, ['scripts/check-puzzles.mjs'], { cwd: root, stdio: 'inherit' });
if (puzzles.error) throw puzzles.error;
if (puzzles.status !== 0) process.exit(puzzles.status || 1);
const save = spawnSync(process.execPath, ['scripts/check-save.mjs'], { cwd: root, stdio: 'inherit' });
if (save.error) throw save.error;
if (save.status !== 0) process.exit(save.status || 1);
