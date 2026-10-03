// Keeps the screen on while something is playing, so a phone does not dim and stop the sound.
let lock = null,
  wanted = false;

async function acquire() {
  if (!wanted || lock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => {
      lock = null;
    });
  } catch (e) {
    // refused (battery saver, unsupported): playback just goes on without it
  }
}

export function keepAwake(on) {
  wanted = on;
  if (on) acquire();
  else if (lock) {
    lock.release().catch(() => {});
    lock = null;
  }
}

// the browser drops the lock when the page is hidden; take it again on return
document.addEventListener('visibilitychange', acquire);
