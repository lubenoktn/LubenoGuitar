// Bounded undo history of JSON snapshots. No page or sound access.
export function createHistory(limit = 50) {
  const items = [];
  return {
    get size() {
      return items.length;
    },
    // sig describes the situation the snapshot belongs to
    push(sig, data) {
      items.push({ sig, data: JSON.stringify(data) });
      if (items.length > limit) items.shift();
    },
    // newest snapshot; undefined when empty; null (and the history is cleared) when it no longer fits sig
    pop(sig) {
      const h = items.pop();
      if (!h) return undefined;
      if (h.sig !== sig) {
        items.length = 0;
        return null;
      }
      return JSON.parse(h.data);
    },
    clear() {
      items.length = 0;
    },
  };
}
