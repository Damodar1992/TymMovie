import { useEffect, useRef } from 'react';

type UseInfiniteScrollOptions = {
  enabled: boolean;
  /** Scroll container; null/undefined = browser viewport */
  root?: Element | null;
  rootMargin?: string;
};

/**
 * Observes a sentinel element and calls `onLoadMore` when it enters the scroll root.
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  { enabled, root = null, rootMargin = '240px 0px' }: UseInfiniteScrollOptions,
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, root, rootMargin]);

  return sentinelRef;
}
