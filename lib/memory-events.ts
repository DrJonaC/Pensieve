"use client";

const eventName = "pensieve:memories-changed";
export function notifyMemoryChange() {
  window.dispatchEvent(new Event(eventName));
  try { localStorage.setItem(eventName, String(Date.now())); } catch { /* Storage can be disabled. */ }
}
export function subscribeMemoryChanges(listener: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === eventName) listener(); };
  window.addEventListener(eventName, listener);
  window.addEventListener("focus", listener);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("focus", listener);
    window.removeEventListener("storage", storage);
  };
}
