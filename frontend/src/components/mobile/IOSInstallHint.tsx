import { useEffect, useState } from 'react';
import { isIOSDevice, isStandalonePwa } from '../../hooks/useIsMobileLayout';

const HINT_STORAGE_KEY = 'tym-movies-ios-install-hint';

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStandalonePwa()) return false;
  if (!isIOSDevice()) return false;
  try {
    if (localStorage.getItem(HINT_STORAGE_KEY) === 'dismissed') return false;
  } catch {
    /* ignore */
  }
  return true;
}

export function IOSInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShow());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(HINT_STORAGE_KEY, 'dismissed');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mobile-install-hint" role="note">
      <span className="mobile-install-hint-text">
        Install TymMovies: tap Share, then “Add to Home Screen”.
      </span>
      <button
        type="button"
        className="mobile-install-hint-close"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
