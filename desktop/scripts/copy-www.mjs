// Copies the site files the studio already serves into desktop/www.
// GitHub Pages keeps publishing the repository root; this folder is only for the desktop shell.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const desktop = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(desktop, '..');
const www = path.join(desktop, 'www');

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

for (const file of ['index.html', 'manifest.webmanifest', 'sw.js']) {
  cpSync(path.join(root, file), path.join(www, file));
}
for (const dir of ['css', 'js', 'icons']) {
  cpSync(path.join(root, dir), path.join(www, dir), { recursive: true });
}

const build = path.join(desktop, 'build');
mkdirSync(build, { recursive: true });
cpSync(path.join(root, 'icons', 'icon-512.png'), path.join(build, 'icon.png'));
console.log(`copied studio files -> ${www}`);
