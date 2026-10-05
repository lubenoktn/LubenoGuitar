// Rodina: shared shopping lists and reminders.
//
// Data flow: every change is applied to the local state at once, saved in
// IndexedDB and put in a queue. While the app is open, tick() sends the queue
// to the API and then asks sync.php for whatever the others changed. Without a
// connection the queue just waits, and the app shows the last saved state.

const API = 'api/';
const POLL_MS = 4000;
const REPEAT_LABELS = {
  '': 'jednorazovo',
  daily: 'každý deň',
  weekly: 'každý týždeň',
  monthly: 'každý mesiac',
  yearly: 'každý rok',
};

// ---------------------------------------------------------------- storage ---

const idb = (() => {
  let dbp;
  const open = () =>
    (dbp ??= new Promise((resolve, reject) => {
      const req = indexedDB.open('rodina', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  const run = (mode, fn) =>
    open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction('kv', mode);
          const req = fn(tx.objectStore('kv'));
          tx.oncomplete = () => resolve(req && req.result);
          tx.onerror = () => reject(tx.error);
        }),
    );
  return {
    get: (key) => run('readonly', (s) => s.get(key)),
    set: (key, value) => run('readwrite', (s) => s.put(value, key)),
    clear: () => run('readwrite', (s) => s.clear()),
  };
})();

// ------------------------------------------------------------------ state ---

const state = {
  token: null,
  user: null,
  family: null,
  members: [],
  cursor: 0,
  lists: new Map(),
  items: new Map(),
  reminders: new Map(),
  queue: [], // [{url, body}] waiting to be sent, oldest first
  online: navigator.onLine,
  tab: location.hash === '#reminders' ? 'reminders' : 'lists',
  listId: null,
  editingReminder: null,
  screen: 'main', // main | settings
};

const TABLES = { lists: 'lists.php', items: 'items.php', reminders: 'reminders.php' };

async function load() {
  const saved = await idb.get('state');
  if (!saved) return;
  Object.assign(state, {
    token: saved.token,
    user: saved.user,
    family: saved.family,
    members: saved.members || [],
    cursor: saved.cursor || 0,
    queue: saved.queue || [],
    listId: saved.listId || null,
  });
  for (const t of Object.keys(TABLES)) state[t] = new Map((saved[t] || []).map((r) => [r.id, r]));
}

let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const data = { token: state.token, user: state.user, family: state.family, members: state.members };
    Object.assign(data, { cursor: state.cursor, queue: state.queue, listId: state.listId });
    for (const t of Object.keys(TABLES)) data[t] = [...state[t].values()];
    idb.set('state', data).catch((e) => console.error('IndexedDB', e));
  }, 100);
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------- networking ---

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* empty or not JSON */
  }
  if (!res.ok) throw new ApiError(res.status, data.error || `Chyba ${res.status}`);
  return data;
}

/** Records a change: applies it locally, queues it for the server and schedules a send. */
function change(table, fields) {
  const current = state[table].get(fields.id);
  const row = { ...(current || {}), ...fields, pending: true };
  if (row.deleted) state[table].delete(row.id);
  else state[table].set(row.id, row);

  const url = TABLES[table];
  const last = state.queue[state.queue.length - 1];
  // several quick changes to the same row (e.g. ticking twice) go as one request
  if (last && !last.sending && last.url === url && last.body.id === fields.id) Object.assign(last.body, fields);
  else state.queue.push({ url, body: { ...fields } });

  save();
  render();
  soon();
}

/** Re-applies queued changes on top of server data, so a sync never undoes them. */
function reapplyQueue() {
  for (const op of state.queue) {
    const table = Object.keys(TABLES).find((t) => TABLES[t] === op.url);
    const current = state[table].get(op.body.id);
    if (op.body.deleted) state[table].delete(op.body.id);
    else state[table].set(op.body.id, { ...(current || {}), ...op.body, pending: true });
  }
}

async function flush() {
  while (state.queue.length) {
    const op = state.queue[0];
    op.sending = true;
    try {
      await api(op.url, { method: 'POST', body: op.body });
    } catch (e) {
      op.sending = false;
      // offline, signed out or a server fault: keep the queue for later
      if (!(e instanceof ApiError) || e.status === 401 || e.status >= 500) throw e;
      // the server refused the change (e.g. the list was deleted meanwhile): drop it
      // and fetch everything again so the screen matches the server
      toast(e.message);
      state.cursor = 0;
    }
    state.queue.shift();
    save();
  }
}

/** Fetches what changed since the last sync; returns true when something did. */
async function sync() {
  const data = await api(`sync.php?since=${state.cursor}`);
  if (state.cursor && state.family && data.family.id !== state.family.id) {
    // moved to another family on another device: what we have belongs to the old one
    clearData();
    return sync();
  }
  let changed =
    data.full ||
    JSON.stringify([data.user, data.family, data.members]) !==
      JSON.stringify([state.user, state.family, state.members]);
  state.user = data.user;
  state.family = data.family;
  state.members = data.members;
  for (const t of Object.keys(TABLES)) {
    if (data.full) state[t] = new Map();
    for (const row of data[t]) {
      if (row.deleted) state[t].delete(row.id);
      else state[t].set(row.id, row);
      changed = true;
    }
  }
  // items of a list deleted by someone else
  for (const [id, item] of state.items) if (!state.lists.has(item.list_id)) state.items.delete(id);
  state.cursor = data.cursor;
  reapplyQueue();
  save();
  return changed;
}

function clearData() {
  state.cursor = 0;
  state.queue = [];
  state.listId = null;
  for (const t of Object.keys(TABLES)) state[t] = new Map();
}

let ticking = false;
let again = false;
async function tick() {
  if (!state.token) return;
  if (ticking) {
    again = true;
    return;
  }
  ticking = true;
  const queued = state.queue.length;
  let changed = false;
  try {
    await flush();
    changed = await sync();
    setOnline(true);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      await signedOut();
      toast('Prihlásenie vypršalo, prihlás sa znova.');
    } else if (e instanceof ApiError) {
      console.error(e);
      setOnline(true);
    } else {
      setOnline(false);
    }
  } finally {
    ticking = false;
    // re-render only when needed, so a half-filled form or an open menu is left alone
    if (changed || state.queue.length !== queued) render();
    if (again) {
      again = false;
      soon();
    }
  }
}

let soonTimer;
function soon() {
  clearTimeout(soonTimer);
  soonTimer = setTimeout(tick, 250);
}

function setOnline(value) {
  if (state.online !== value) {
    state.online = value;
    render();
  }
}

let pollTimer;
function startPolling() {
  clearInterval(pollTimer);
  if (document.visibilityState === 'visible' && state.token) {
    tick();
    pollTimer = setInterval(tick, POLL_MS);
  }
}
document.addEventListener('visibilitychange', startPolling);
addEventListener('online', () => tick());
addEventListener('offline', () => setOnline(false));

// ------------------------------------------------------------ push notifications

function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function base64UrlToBytes(s) {
  const raw = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function enablePush() {
  if (!pushSupported()) {
    toast(
      /iPhone|iPad/.test(navigator.userAgent)
        ? 'Na iPhone najprv pridaj appku na plochu (Zdieľať → Pridať na plochu) a otvor ju odtiaľ.'
        : 'Tento prehliadač notifikácie nepodporuje.',
    );
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    toast('Notifikácie sú v prehliadači zakázané.');
    return;
  }
  const { publicKey } = await api('push.php');
  if (!publicKey) {
    toast('Server nemá nastavené kľúče VAPID.');
    return;
  }
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub)
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) });
  await api('push.php', { method: 'POST', body: sub.toJSON() });
  toast('Notifikácie sú zapnuté.');
  render();
}

async function disablePush() {
  const sub = await currentSubscription();
  if (sub) {
    await api('push.php', { method: 'DELETE', body: { endpoint: sub.endpoint } }).catch(() => {});
    await sub.unsubscribe();
  }
  render();
}

// ------------------------------------------------------------- account ---

async function signedIn(data) {
  state.token = data.token;
  state.user = data.user;
  state.family = data.family;
  state.members = data.members;
  clearData();
  history.replaceState(null, '', location.pathname + location.hash);
  save();
  render();
  startPolling();
  // re-attach this device's notifications to the account that just signed in
  const sub = await currentSubscription().catch(() => null);
  if (sub) api('push.php', { method: 'POST', body: sub.toJSON() }).catch(() => {});
}

async function signedOut() {
  clearInterval(pollTimer);
  Object.assign(state, { token: null, user: null, family: null, members: [], screen: 'main' });
  clearData();
  await idb.clear();
  render();
}

async function logout() {
  if (state.queue.length && !confirm('Niektoré zmeny ešte nie sú odoslané a stratia sa. Odhlásiť?')) return;
  await disablePush().catch(() => {});
  await api('auth.php?action=logout', { method: 'POST' }).catch(() => {});
  await signedOut();
}

async function accountAction(action, body) {
  try {
    const data = await api(`auth.php?action=${action}`, { method: 'POST', body });
    const movedFamily = data.family.id !== state.family?.id;
    state.user = data.user;
    state.family = data.family;
    state.members = data.members;
    if (movedFamily) clearData();
    save();
    render();
    soon();
    return true;
  } catch (e) {
    toast(e instanceof ApiError ? e.message : 'Nie si pripojený.');
    return false;
  }
}

// ------------------------------------------------------------------- view ---

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat(Infinity).filter((c) => c != null && c !== false));
  return el;
}

function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = h('div', { class: 'toast', role: 'status' }, message);
  document.body.append(el);
  setTimeout(() => el.remove(), 3500);
}

function memberName(id) {
  return state.members.find((m) => m.id === id)?.name ?? '';
}

const dateFmt = new Intl.DateTimeFormat('sk-SK', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function toLocalInput(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function render() {
  const root = document.getElementById('app');
  const focused = document.activeElement?.dataset?.keep;
  const value = focused && document.activeElement.value;
  root.replaceChildren(state.token ? mainView() : authView());
  if (focused) {
    const el = root.querySelector(`[data-keep="${focused}"]`);
    if (el) {
      el.value = value;
      el.focus();
    }
  }
}

// keeps what was typed in a form across re-renders caused by polling
const drafts = {};
function draft(key, attrs = {}) {
  return h('input', {
    ...attrs,
    value: drafts[key] ?? attrs.value ?? '',
    'data-keep': key,
    oninput: (e) => (drafts[key] = e.target.value),
  });
}

function authView() {
  const mode = drafts.authMode || (new URLSearchParams(location.search).get('invite') ? 'register' : 'login');
  const invite = new URLSearchParams(location.search).get('invite') || '';
  const join = drafts.join ?? Boolean(invite);
  const error = h('p', { class: 'error' });

  const submit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const button = e.target.querySelector('button[type=submit]');
    button.disabled = true;
    try {
      const body =
        mode === 'login'
          ? { email: f.email, password: f.password }
          : {
              name: f.name,
              email: f.email,
              password: f.password,
              ...(join ? { invite_code: f.invite_code } : { family_name: f.family_name }),
            };
      const data = await api(`auth.php?action=${mode}`, { method: 'POST', body });
      for (const k of Object.keys(drafts)) delete drafts[k];
      await signedIn(data);
    } catch (err) {
      error.textContent = err instanceof ApiError ? err.message : 'Nepodarilo sa spojiť so serverom.';
      button.disabled = false;
    }
  };

  const setMode = (m) => {
    drafts.authMode = m;
    render();
  };

  return h(
    'div',
    { class: 'auth' },
    h('h1', {}, 'Rodina'),
    h('p', { class: 'muted', style: 'text-align:center' }, 'Spoločné nákupy a pripomienky'),
    h(
      'div',
      { class: 'segmented' },
      h('button', { class: mode === 'login' ? 'active' : '', onclick: () => setMode('login') }, 'Prihlásiť sa'),
      h('button', { class: mode === 'register' ? 'active' : '', onclick: () => setMode('register') }, 'Nový účet'),
    ),
    h(
      'form',
      { class: 'card stack', onsubmit: submit },
      mode === 'register' &&
        h(
          'label',
          { class: 'field' },
          'Meno',
          draft('name', { name: 'name', required: true, autocomplete: 'given-name' }),
        ),
      h(
        'label',
        { class: 'field' },
        'E-mail',
        draft('email', { name: 'email', type: 'email', required: true, autocomplete: 'email' }),
      ),
      h(
        'label',
        { class: 'field' },
        'Heslo',
        h('input', {
          name: 'password',
          type: 'password',
          required: true,
          minLength: mode === 'register' ? 8 : undefined,
          autocomplete: mode === 'login' ? 'current-password' : 'new-password',
        }),
      ),
      mode === 'register' && [
        h(
          'div',
          { class: 'segmented' },
          h(
            'button',
            { type: 'button', class: join ? '' : 'active', onclick: () => ((drafts.join = false), render()) },
            'Nová rodina',
          ),
          h(
            'button',
            { type: 'button', class: join ? 'active' : '', onclick: () => ((drafts.join = true), render()) },
            'Mám pozvánku',
          ),
        ),
        join
          ? h(
              'label',
              { class: 'field' },
              'Kód pozvánky',
              draft('invite', { name: 'invite_code', required: true, value: invite, autocapitalize: 'characters' }),
            )
          : h(
              'label',
              { class: 'field' },
              'Názov rodiny',
              draft('family', { name: 'family_name', required: true, placeholder: 'napr. Novákovci' }),
            ),
      ],
      error,
      h('button', { type: 'submit', class: 'primary' }, mode === 'login' ? 'Prihlásiť sa' : 'Vytvoriť účet'),
    ),
  );
}

function mainView() {
  const titles = { lists: 'Nákup', reminders: 'Pripomienky' };
  const setTab = (tab) => {
    state.tab = tab;
    state.screen = 'main';
    history.replaceState(null, '', tab === 'reminders' ? '#reminders' : '#');
    render();
  };
  return h(
    'div',
    { class: 'app' },
    h(
      'header',
      {},
      h('h1', {}, state.screen === 'settings' ? 'Nastavenia' : `${titles[state.tab]} · ${state.family?.name ?? ''}`),
      !state.online && h('span', { class: 'badge' }, 'offline'),
      state.queue.length > 0 &&
        h('span', { class: 'badge', title: 'Zmeny čakajúce na odoslanie' }, `↑ ${state.queue.length}`),
      h(
        'button',
        {
          class: 'ghost',
          'aria-label': 'Nastavenia',
          onclick: () => ((state.screen = state.screen === 'settings' ? 'main' : 'settings'), render()),
        },
        state.screen === 'settings' ? '✕' : '⚙︎',
      ),
    ),
    h('main', {}, state.screen === 'settings' ? settingsView() : state.tab === 'lists' ? listsView() : remindersView()),
    h(
      'nav',
      { class: 'tabs' },
      h(
        'button',
        { class: state.tab === 'lists' && state.screen === 'main' ? 'active' : '', onclick: () => setTab('lists') },
        '🛒 Nákup',
      ),
      h(
        'button',
        {
          class: state.tab === 'reminders' && state.screen === 'main' ? 'active' : '',
          onclick: () => setTab('reminders'),
        },
        '⏰ Pripomienky',
      ),
    ),
  );
}

// ---------------------------------------------------------------- lists ---

function listsView() {
  const lists = [...state.lists.values()].sort(
    (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, 'sk'),
  );
  if (!state.lists.has(state.listId)) state.listId = lists[0]?.id ?? null;

  const addList = () => {
    const name = prompt('Názov nového zoznamu', lists.length ? '' : 'Nákup')?.trim();
    if (!name) return;
    const id = uuid();
    change('lists', { id, name, sort: lists.length });
    state.listId = id;
    render();
  };

  const chips = h(
    'div',
    { class: 'chips' },
    lists.map((l) =>
      h(
        'button',
        { class: l.id === state.listId ? 'active' : '', onclick: () => ((state.listId = l.id), save(), render()) },
        l.name,
      ),
    ),
    h('button', { onclick: addList, 'aria-label': 'Nový zoznam' }, '＋'),
  );
  if (!state.listId) {
    return [
      chips,
      h(
        'div',
        { class: 'empty' },
        h('p', {}, 'Zatiaľ nemáte žiadny zoznam.'),
        h('button', { class: 'primary', onclick: addList }, 'Vytvoriť zoznam'),
      ),
    ];
  }

  const list = state.lists.get(state.listId);
  const items = [...state.items.values()].filter((i) => i.list_id === list.id);
  const open = items.filter((i) => !i.done).sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
  const done = items.filter((i) => i.done).sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0));

  const add = (e) => {
    e.preventDefault();
    const text = (drafts.item || '').trim();
    if (!text) return;
    change('items', {
      id: uuid(),
      list_id: list.id,
      text,
      qty: (drafts.qty || '').trim(),
      done: 0,
      created_at: Date.now(),
      added_by: state.user.id,
    });
    drafts.item = drafts.qty = '';
    render();
    document.querySelector('[data-keep=item]')?.focus();
  };

  const listMenu = () => {
    const name = prompt('Premenovať zoznam (alebo vymaž názov a zoznam sa zmaže)', list.name);
    if (name === null) return;
    if (name.trim()) change('lists', { id: list.id, name: name.trim() });
    else if (confirm(`Zmazať zoznam „${list.name}“ aj s položkami?`)) {
      for (const i of items) state.items.delete(i.id);
      change('lists', { id: list.id, deleted: 1 });
    }
  };

  return [
    chips,
    h(
      'form',
      { class: 'row', onsubmit: add },
      draft('item', { placeholder: 'Pridať položku…', enterKeyHint: 'done', autocomplete: 'off' }),
      draft('qty', { class: 'qty', placeholder: 'ks', autocomplete: 'off' }),
      h('button', { class: 'primary', type: 'submit', 'aria-label': 'Pridať' }, '＋'),
    ),
    open.length
      ? h('ul', { class: 'items' }, open.map(itemRow))
      : h('p', { class: 'empty' }, done.length ? 'Všetko kúpené 🎉' : 'Zoznam je prázdny.'),
    done.length > 0 && [
      h(
        'div',
        { class: 'section-title' },
        h('span', {}, `V košíku (${done.length})`),
        h(
          'button',
          { class: 'ghost', onclick: () => done.forEach((i) => change('items', { id: i.id, deleted: 1 })) },
          'Vymazať',
        ),
      ),
      h('ul', { class: 'items' }, done.map(itemRow)),
    ],
    h(
      'div',
      { class: 'section-title' },
      h('span', {}),
      h('button', { class: 'ghost', onclick: listMenu }, 'Upraviť zoznam'),
    ),
  ];
}

function itemRow(item) {
  const edit = () => {
    const text = prompt('Upraviť položku', item.text);
    if (text === null) return;
    if (text.trim()) change('items', { id: item.id, text: text.trim() });
    else change('items', { id: item.id, deleted: 1 });
  };
  const by = item.added_by && item.added_by !== state.user?.id ? memberName(item.added_by) : '';
  return h(
    'li',
    { class: `${item.done ? 'done' : ''} ${item.pending ? 'pending' : ''}` },
    h(
      'span',
      {
        class: 'check',
        onclick: () => change('items', { id: item.id, done: item.done ? 0 : 1 }),
        role: 'checkbox',
        'aria-checked': String(Boolean(item.done)),
      },
      item.done ? '✓' : '',
    ),
    h(
      'div',
      { class: 'main', onclick: () => change('items', { id: item.id, done: item.done ? 0 : 1 }), ondblclick: edit },
      h('div', { class: 'text' }, item.qty && h('span', { class: 'qty' }, item.qty), item.text),
      (by || item.pending) &&
        h('div', { class: 'meta' }, [by, item.pending && 'čaká na odoslanie'].filter(Boolean).join(' · ')),
    ),
    h('button', { class: 'ghost', onclick: edit, 'aria-label': 'Upraviť' }, '✎'),
  );
}

// ------------------------------------------------------------- reminders ---

function clearReminderDrafts() {
  for (const k of ['rtext', 'rdue', 'rrepeat', 'rfor']) delete drafts[k];
}

function remindersView() {
  const editing = state.editingReminder && state.reminders.get(state.editingReminder);
  const now = Date.now();
  const all = [...state.reminders.values()];
  const upcoming = all.filter((r) => !r.done && !(r.sent && !r.repeat)).sort((a, b) => a.due_at - b.due_at);
  const past = all.filter((r) => r.done || (r.sent && !r.repeat)).sort((a, b) => b.due_at - a.due_at);

  const defaultDue = () => {
    const d = new Date(now + 3600000);
    d.setMinutes(0, 0, 0);
    return toLocalInput(d.getTime());
  };

  const submit = (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const due = new Date(f.due).getTime();
    if (!f.text.trim() || !due) return;
    const fields = {
      text: f.text.trim(),
      due_at: due,
      repeat: f.repeat,
      for_user: f.for_user ? Number(f.for_user) : null,
    };
    if (editing) {
      const changed = { id: editing.id };
      for (const [k, v] of Object.entries(fields)) if (editing[k] !== v) changed[k] = v;
      if (changed.due_at || changed.repeat !== undefined) Object.assign(changed, { sent: 0, done: 0 });
      change('reminders', changed);
    } else {
      change('reminders', { id: uuid(), ...fields, done: 0, sent: 0, created_by: state.user.id });
    }
    state.editingReminder = null;
    clearReminderDrafts();
    e.target.reset();
    render();
  };

  const form = h(
    'form',
    { class: 'card stack', onsubmit: submit },
    h('h2', {}, editing ? 'Upraviť pripomienku' : 'Nová pripomienka'),
    draft('rtext', {
      name: 'text',
      placeholder: 'napr. Zaplatiť škôlku',
      required: true,
      value: editing?.text,
      autocomplete: 'off',
    }),
    h(
      'label',
      { class: 'field' },
      'Kedy',
      draft('rdue', {
        name: 'due',
        type: 'datetime-local',
        required: true,
        value: editing ? toLocalInput(editing.due_at) : defaultDue(),
      }),
    ),
    h(
      'div',
      { class: 'two' },
      h(
        'label',
        { class: 'field' },
        'Opakovať',
        h(
          'select',
          { name: 'repeat', onchange: (e) => (drafts.rrepeat = e.target.value) },
          Object.entries(REPEAT_LABELS).map(([v, label]) =>
            h('option', { value: v, selected: (drafts.rrepeat ?? editing?.repeat ?? '') === v }, label),
          ),
        ),
      ),
      h(
        'label',
        { class: 'field' },
        'Pre koho',
        h(
          'select',
          { name: 'for_user', onchange: (e) => (drafts.rfor = e.target.value) },
          h('option', { value: '' }, 'Pre všetkých'),
          state.members.map((m) =>
            h(
              'option',
              { value: m.id, selected: (drafts.rfor ?? String(editing?.for_user ?? '')) === String(m.id) },
              m.id === state.user?.id ? `${m.name} (ja)` : m.name,
            ),
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'two' },
      editing
        ? h(
            'button',
            { type: 'button', onclick: () => ((state.editingReminder = null), clearReminderDrafts(), render()) },
            'Zrušiť',
          )
        : h('span'),
      h('button', { type: 'submit', class: 'primary' }, editing ? 'Uložiť' : 'Pridať'),
    ),
  );

  const row = (r) => {
    const overdue = !r.done && r.due_at < now && !r.sent;
    const meta = [
      dateFmt.format(r.due_at),
      r.repeat && REPEAT_LABELS[r.repeat],
      r.for_user ? `pre ${memberName(r.for_user)}` : 'pre všetkých',
      r.pending && 'čaká na odoslanie',
    ]
      .filter(Boolean)
      .join(' · ');
    const startEdit = () => {
      state.editingReminder = r.id;
      clearReminderDrafts();
      render();
      scrollTo({ top: 0, behavior: 'smooth' });
    };
    return h(
      'li',
      { class: `${r.done ? 'done' : ''} ${overdue ? 'overdue' : ''} ${r.pending ? 'pending' : ''}` },
      h(
        'span',
        {
          class: 'check',
          role: 'checkbox',
          'aria-checked': String(Boolean(r.done)),
          onclick: () => change('reminders', { id: r.id, done: r.done ? 0 : 1 }),
        },
        r.done ? '✓' : '',
      ),
      h(
        'div',
        { class: 'main', onclick: startEdit },
        h('div', { class: 'text' }, r.text),
        h('div', { class: 'meta' }, meta),
      ),
      h(
        'button',
        {
          class: 'ghost danger',
          'aria-label': 'Zmazať',
          onclick: () => confirm(`Zmazať „${r.text}“?`) && change('reminders', { id: r.id, deleted: 1 }),
        },
        '✕',
      ),
    );
  };

  return [
    form,
    upcoming.length
      ? h('ul', { class: 'items' }, upcoming.map(row))
      : h('p', { class: 'empty' }, 'Žiadne naplánované pripomienky.'),
    past.length > 0 && [
      h('div', { class: 'section-title' }, h('span', {}, 'Hotové a odoslané')),
      h('ul', { class: 'items' }, past.slice(0, 30).map(row)),
    ],
  ];
}

// -------------------------------------------------------------- settings ---

function settingsView() {
  const inviteUrl = `${location.origin}${location.pathname}?invite=${state.family.invite_code}`;
  const share = async () => {
    const text = `Pridaj sa k rodine „${state.family.name}“ v appke Rodina: ${inviteUrl} (kód ${state.family.invite_code})`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else {
      await navigator.clipboard?.writeText(text);
      toast('Pozvánka skopírovaná.');
    }
  };

  const pushBox = h('div', { class: 'stack' }, h('p', { class: 'muted' }, 'Zisťujem…'));
  currentSubscription()
    .then((sub) => {
      pushBox.replaceChildren(
        h(
          'p',
          { class: 'muted' },
          sub
            ? 'Toto zariadenie dostáva pripomienky.'
            : 'Pripomienky prídu ako notifikácia aj vtedy, keď je appka zatvorená.',
        ),
        sub
          ? h(
              'div',
              { class: 'two' },
              h(
                'button',
                {
                  onclick: () =>
                    api('push.php', { method: 'POST', body: { test: true } }).then(
                      (r) => toast(`Odoslané na ${r.sent} zariadení.`),
                      (e) => toast(e.message),
                    ),
                },
                'Skúšobná',
              ),
              h('button', { class: 'danger', onclick: disablePush }, 'Vypnúť'),
            )
          : h(
              'button',
              { class: 'primary', onclick: () => enablePush().catch((e) => toast(e.message)) },
              'Zapnúť notifikácie',
            ),
      );
    })
    .catch(() => pushBox.replaceChildren(h('p', { class: 'muted' }, 'Notifikácie nie sú dostupné.')));

  return [
    h(
      'div',
      { class: 'card stack' },
      h('h2', {}, `Rodina ${state.family.name}`),
      h('p', { class: 'muted' }, 'Kód pozvánky – kto sa s ním zaregistruje, uvidí vaše zoznamy a pripomienky:'),
      h('div', { class: 'code' }, state.family.invite_code),
      h(
        'div',
        { class: 'two' },
        h('button', { class: 'primary', onclick: share }, 'Poslať pozvánku'),
        h(
          'button',
          {
            onclick: () =>
              confirm('Vytvoriť nový kód? Starý prestane platiť.') && accountAction('family', { new_code: true }),
          },
          'Nový kód',
        ),
      ),
      h('p', { class: 'muted' }, 'Členovia: ' + state.members.map((m) => m.name).join(', ')),
      h(
        'button',
        {
          class: 'ghost',
          onclick: () => {
            const name = prompt('Názov rodiny', state.family.name)?.trim();
            if (name) accountAction('family', { name });
          },
        },
        'Premenovať rodinu',
      ),
    ),
    h('div', { class: 'card stack' }, h('h2', {}, 'Notifikácie'), pushBox),
    h(
      'div',
      { class: 'card stack' },
      h('h2', {}, state.user.name),
      h('p', { class: 'muted' }, state.user.email),
      h(
        'div',
        { class: 'two' },
        h(
          'button',
          {
            onclick: () => {
              const name = prompt('Tvoje meno', state.user.name)?.trim();
              if (name) accountAction('profile', { name });
            },
          },
          'Zmeniť meno',
        ),
        h(
          'button',
          {
            onclick: () => {
              const code = prompt('Kód pozvánky inej rodiny (tvoje doterajšie zoznamy ostanú pôvodnej rodine)')?.trim();
              if (code) accountAction('join', { invite_code: code }).then((ok) => ok && toast('Si v novej rodine.'));
            },
          },
          'Prejsť do inej rodiny',
        ),
      ),
      h('button', { class: 'danger', onclick: logout }, 'Odhlásiť sa'),
    ),
  ];
}

// ------------------------------------------------------------------ start ---

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('service worker', e));
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'open' && e.data.url?.includes('#reminders')) {
      state.tab = 'reminders';
      state.screen = 'main';
      render();
    }
  });
}
addEventListener('hashchange', () => {
  state.tab = location.hash === '#reminders' ? 'reminders' : 'lists';
  render();
});

await load().catch((e) => console.error('IndexedDB', e));
render();
startPolling();

window.__rodina = { state, tick, sync, flush };
