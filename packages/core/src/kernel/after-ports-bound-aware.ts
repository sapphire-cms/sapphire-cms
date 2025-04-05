/**
 * Running after all layer ports were bound.
 * Layer can submit requests into its ports only after this lifecycle hook was executed.
 */
export interface AfterPortsBoundAware {
  afterPortsBound: () => Promise<void>;
}

export function isAfterPortsBoundAware(obj: unknown): obj is AfterPortsBoundAware {
  return (
      typeof obj === 'object' &&
      obj !== null &&
      'afterPortsBound' in obj &&
      typeof (obj as any).afterPortsBound === 'function'
  );
}

