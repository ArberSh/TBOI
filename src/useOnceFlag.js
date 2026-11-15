import { useState } from 'react';

// Shows true exactly once per browser — flips to false forever after dismiss() is called.
export function useOnceFlag(storageKey) {
  const [show, setShow] = useState(() => {
    try { return !localStorage.getItem(storageKey); } catch { return false; }
  });

  const dismiss = () => {
    try { localStorage.setItem(storageKey, 'true'); } catch { /* ignore */ }
    setShow(false);
  };

  return [show, dismiss];
}
