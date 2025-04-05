/**
 * Running after the layer was instantiated but before ports were bound.
 * Suitable for initialization logic.
 */
export interface AfterInitAware {
  afterInit: () => Promise<void>;
}

export function isAfterInitAware(obj: unknown): obj is AfterInitAware {
  return (
      typeof obj === 'object' &&
      obj !== null &&
      'afterInit' in obj &&
      typeof (obj as any).afterInit === 'function'
  );
}
