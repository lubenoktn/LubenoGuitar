// Installable app: web manifest, icons, offline service worker and the Install button.
import { $ } from './dom.js';

export function initPwa() {
  // a file opened from disk has no manifest or service worker; they exist only on the web address
  if (!/^https?:$/.test(location.protocol)) return;
  const link = (rel, href) => {
    const l = document.createElement('link');
    l.rel = rel;
    l.href = href;
    document.head.appendChild(l);
  };
  link('manifest', 'manifest.webmanifest');
  link('icon', 'icon-192.png');
  link('apple-touch-icon', 'apple-touch-icon.png');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  // browsers that offer installation hand over a prompt; show the button only then
  let ask = null;
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    ask = e;
    $('install').classList.remove('hidden');
  });
  addEventListener('appinstalled', () => $('install').classList.add('hidden'));
  $('install').onclick = async () => {
    if (!ask) return;
    ask.prompt();
    await ask.userChoice;
    ask = null;
    $('install').classList.add('hidden');
  };
}
