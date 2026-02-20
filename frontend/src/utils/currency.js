/**
 * Format amount as Vanuatu Vatu (VUV).
 * VUV has no minor unit; display as whole numbers.
 */
export function formatVUV(amount) {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return '— VUV';
  const whole = Math.round(n);
  return `${whole.toLocaleString()} VUV`;
}
