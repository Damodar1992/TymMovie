/** ISO date (YYYY-MM-DD) → DD.MM.YYYY */
export function isoToDmy(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return '';
  return `${day}.${month}.${year}`;
}
