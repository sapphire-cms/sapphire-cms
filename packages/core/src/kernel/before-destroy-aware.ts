/**
 * Running just before CMS halts.
 * Suitable for cleanup logic.
 */
export interface BeforeDestroyAware {
  beforeDestroy: () => Promise<void>;
}

export function isBeforeDestroyAware(obj: unknown): obj is BeforeDestroyAware {
  return (
      typeof obj === 'object' &&
      obj !== null &&
      'beforeDestroy' in obj &&
      typeof obj['beforeDestroy'] === 'function'
  );
}
