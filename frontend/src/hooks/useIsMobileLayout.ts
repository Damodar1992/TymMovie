import { useEffect, useState } from 'react';

const NARROW_QUERY = '(max-width: 640px)';
const STANDALONE_QUERY = '(display-mode: standalone)';

function evaluate(): boolean {
  if (typeof window === 'undefined') return false;
  const narrow = window.matchMedia(NARROW_QUERY).matches;
  const standalone =
    window.matchMedia(STANDALONE_QUERY).matches ||
    // iOS Safari standalone flag
    // @ts-expect-error legacy iOS property
    window.navigator.standalone === true;
  return narrow || standalone;
}

/**
 * Returns true when we should render the mobile-app shell:
 * - narrow viewport (<= 640px), OR
 * - app launched in PWA standalone mode (any size).
 */
export function useIsMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(evaluate);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const narrow = window.matchMedia(NARROW_QUERY);
    const standalone = window.matchMedia(STANDALONE_QUERY);
    const update = () => setIsMobile(evaluate());

    narrow.addEventListener('change', update);
    standalone.addEventListener('change', update);

    return () => {
      narrow.removeEventListener('change', update);
      standalone.removeEventListener('change', update);
    };
  }, []);

  return isMobile;
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error legacy iOS property
    window.navigator.standalone === true
  );
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports as Mac with touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}
