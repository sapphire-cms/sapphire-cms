export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return value !== null && typeof value === 'object' && typeof (value as any).then === 'function';
}
