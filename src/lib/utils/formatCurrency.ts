export function formatPence(pence: number): string {
  if (pence < 100) return `${pence}p`;
  const pounds = pence / 100;
  return `£${pounds.toFixed(2)}`;
}
