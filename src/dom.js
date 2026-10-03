// Small DOM helpers shared by every module: element lookup, toast messages, safe localStorage.
export const $ = (id) => document.getElementById(id);
export const toast = (m) => {
  const t = document.createElement('div');
  t.className = 'px-4 py-2 rounded-xl border border-cyan-500/40 bg-s8 text-cyan-300 text-xs font-semibold';
  t.textContent = m;
  $('toast').appendChild(t);
  setTimeout(() => t.remove(), 2600);
};
export const LS = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      return false;
    }
  },
};
