/** Map 0–10 score → 0–5 stars (2 pts = 1 star), including fractional fills. */
export function starFillFractions(score: number): number[] {
  const total = Math.min(5, Math.max(0, score / 2));
  return Array.from({ length: 5 }, (_, index) => {
    const remaining = total - index;
    if (remaining >= 1) return 1;
    if (remaining <= 0) return 0;
    return remaining;
  });
}
