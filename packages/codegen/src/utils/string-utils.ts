export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function capitalize(str: string): string {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}
