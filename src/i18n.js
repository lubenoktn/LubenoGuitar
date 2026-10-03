// Language switching: L() translates one text, i18n() translates the static page.
import { EN } from './lang/en.js';
import { OPT } from './options.js';

export const L = (s) => (OPT.lang === 'en' && EN[s]) || s;
// translates the static page: text nodes and aria-label/placeholder attributes whose Slovak text is a key of EN
export function i18n() {
  const en = OPT.lang === 'en',
    w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (n._sk === undefined) {
      const k = n.nodeValue.trim();
      if (!k || !(k in EN) || n.parentNode.closest('script,style')) continue;
      n._sk = n.nodeValue;
    }
    const k = n._sk.trim();
    n.nodeValue = en ? n._sk.replace(k, EN[k]) : n._sk;
  }
  document.querySelectorAll('[aria-label],[placeholder]').forEach((e) =>
    ['aria-label', 'placeholder'].forEach((a) => {
      const p = '_' + a;
      if (e[p] === undefined) {
        const v = e.getAttribute(a);
        if (!v || !(v in EN)) return;
        e[p] = v;
      }
      e.setAttribute(a, en ? EN[e[p]] : e[p]);
    }),
  );
}
