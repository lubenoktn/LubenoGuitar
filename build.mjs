// Builds the whole app into one self-contained file: LubenoGuitar.html
// (page skeleton from src/app.html + compiled styles + bundled modules).
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';

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

// ---- manual.html: both languages from docs/manual.<lang>.md in one page
// A heading written as "## Title {#id}" gets the id "<lang>-id", so both languages can share the page.
function manualPart(lang) {
  const md = readFileSync(`docs/manual.${lang}.md`, 'utf8');
  const title = md.match(/^# (.+)$/m)[1];
  const toc = [];
  const body = marked
    .parse(md.replace(/^# .+$/m, ''))
    .replace(/<(h[23])>(.*?) \{#([\w-]+)\}<\/\1>/g, (_, h, text, id) => {
      toc.push({ sub: h === 'h3', id, text });
      return `<${h} id="${lang}-${id}">${text}</${h}>`;
    })
    .replace(/href="#([\w-]+)"/g, `href="#${lang}-$1"`)
    .replace(/<table>/g, '<div class="tw"><table>')
    .replace(/<\/table>/g, '</table></div>');
  let list = '';
  toc.forEach((t, i) => {
    const next = toc[i + 1];
    list += `<li><a href="#${lang}-${t.id}">${t.text}</a>`;
    if (!t.sub && next && next.sub) list += '<ul>';
    else list += '</li>';
    if (t.sub && (!next || !next.sub)) list += '</ul></li>';
  });
  return {
    toc: `<ul data-lang="${lang}">${list}</ul>`,
    body: `<article data-lang="${lang}" lang="${lang}"><h1>${title}</h1>${body}</article>`,
  };
}
const parts = ['sk', 'en'].map(manualPart);
const manual = readFileSync('src/manual.html', 'utf8')
  .replace('<!--TOC-->', () => parts.map((p) => p.toc).join(''))
  .replace('<!--BODY-->', () => parts.map((p) => p.body).join(''));
writeFileSync('manual.html', manual);
console.log(`manual.html: ${(manual.length / 1024).toFixed(1)} kB`);
