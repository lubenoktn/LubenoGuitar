// Builds the whole app into one self-contained file: LubenoGuitar.html
// (page skeleton from src/app.html + compiled styles + bundled modules).
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'LubenoGuitar.html';

const bundle = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  minifyWhitespace: true,
  minifySyntax: true,
  write: false,
  logLevel: 'warning',
});
// a literal "</script" inside the code would end the inline script early
const js = bundle.outputFiles[0].text.trim().replace(/<\/script/gi, '<\\/script');

const css = execFileSync(
  'node_modules/.bin/tailwindcss',
  ['-c', 'tailwind.config.js', '-i', 'src/styles.css', '--minify'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
).trim();

const html = readFileSync('src/app.html', 'utf8')
  .replace('/*CSS*/', () => css)
  .replace('/*JS*/', () => js);

writeFileSync(OUT, html);
console.log(
  `${OUT}: ${(html.length / 1024).toFixed(1)} kB (js ${(js.length / 1024).toFixed(1)} kB, css ${(css.length / 1024).toFixed(1)} kB)`,
);
