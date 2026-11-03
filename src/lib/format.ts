export function usd(value: number): string {
  return "$" + value.toLocaleString("en-US");
}
