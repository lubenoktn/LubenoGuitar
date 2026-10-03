# LubenoGuitar

Cvičebná aplikácia pre gitaristov v jednom súbore: stupnice na hmatníku, sprievod k akordovej postupnosti, generovaná a upraviteľná melódia s tabulatúrou, kvíz a ladička. Rozhranie je po slovensky a po anglicky.

A single-file practice app for guitarists: scales on the fretboard, backing tracks for chord progressions, generated and editable melodies with tablature, a quiz and a tuner. The interface is in Slovak and English.

**Online:** https://lubenoktn.github.io/LubenoGuitar/

## Použitie / Usage

Otvor appku online (na telefóne sa dá nainštalovať na plochu a potom funguje aj offline), alebo si [stiahni jeden súbor](https://lubenoktn.github.io/LubenoGuitar/LubenoGuitar.html) (Uložiť ako) a otvor ho v prehliadači. Nič sa neinštaluje a funguje aj bez internetu.

Use it online (on a phone it can be installed to the home screen and then works offline), or [download the single file](https://lubenoktn.github.io/LubenoGuitar/LubenoGuitar.html) (Save as) and open it in a browser. Nothing to install; it works offline.

Manuál / Manual: [slovensky](https://lubenoktn.github.io/LubenoGuitar/manual.html?lang=sk) · [English](https://lubenoktn.github.io/LubenoGuitar/manual.html?lang=en)

## Vývoj / Development

`LubenoGuitar.html` is a build product and is not kept in the repository. Edit the sources in `src/` and build it with the commands below.

```bash
npm install     # once: esbuild, Tailwind, Prettier
npm run build   # src/ -> LubenoGuitar.html, docs/ -> manual.html
npm test        # unit tests of the logic modules
npm run format  # Prettier
```

| Path | What it holds |
| --- | --- |
| `src/app.html` | page skeleton; the build inserts the styles and the script |
| `src/styles.css` | Tailwind entry and the app's own styles |
| `src/main.js` | entry point: loads every module, wires the controls, starts the app |
| `src/theory.js`, `data.js`, `options.js` | notes, scales, chords, degrees; grooves and presets |
| `src/voicing.js`, `midi.js`, `pitch.js`, `songdata.js` | chord shapes, MIDI encoder, pitch detection, validation and share-link packing |
| `src/audio.js`, `sequencer.js`, `melody.js` | synthesis, scheduler and grooves, melody generation |
| `src/state.js`, `export.js`, `i18n.js`, `lang/en.js` | saving and loading, tab and MIDI export, language |
| `src/ui/` | fretboard, tablature and melody editor, chord diagrams, quiz, tuner, sections, sharing |
| `src/pwa.js`, `public/` | installable app: manifest, service worker (offline copy), icons, and the page that forwards the short address |
| `docs/manual.sk.md`, `docs/manual.en.md` | the manual in both languages; `## Title {#id}` gives a chapter its link target |
| `src/manual.html`, `src/help.js` | manual page skeleton; the `?` links from the app to manual chapters |
| `test/` | tests for the modules that touch neither the page nor the sound |

Modules that touch neither the page nor the sound (`theory`, `data`, `voicing`, `midi`, `pitch`, `songdata`, `history`) can be imported in Node and are covered by tests. In the browser console, `__lg` exposes everything the modules export.

When a feature changes, update both manual files; the tests fail if their chapters differ or an app help link points to a missing chapter.

## Nasadenie / Deployment

Every push to `main` runs the tests, builds the app and publishes it to GitHub Pages (`.github/workflows/deploy.yml`). Pull requests are tested and built but not published. To host it elsewhere, run `npm run build` and upload `LubenoGuitar.html` and `manual.html` together with the contents of `public/` to any static host served over HTTPS.

## Licencia / License

[MIT](LICENSE)
