export function replaceAt(str: string, index: number, length: number, replacement: string): string {
  return str.slice(0, index) + replacement + str.slice(index + length);
}
