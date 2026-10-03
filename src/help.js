// Links from the app to the manual page (manual.html), in the app's language.
import { OPT } from './options.js';

// where the manual lives when the app runs from a downloaded file
export const SITE = 'https://lubenoktn.github.io/LubenoGuitar/';

// every <a data-help="chapter"> opens the manual at that chapter; an empty value opens its start
export function helpLinks() {
  const base = (/^https?:$/.test(location.protocol) ? '' : SITE) + 'manual.html?lang=' + OPT.lang;
  document.querySelectorAll('a[data-help]').forEach((a) => {
    a.href = base + (a.dataset.help ? '#' + a.dataset.help : '');
    a.target = '_blank';
    a.rel = 'noopener';
  });
}
