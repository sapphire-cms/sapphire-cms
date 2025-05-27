import { Outcome } from 'defectless';

/**
 * Running after all layer ports were bound.
 * Layer can submit requests into its ports only after this lifecycle hook was executed.
 */
export interface AfterPortsBoundAware {
  afterPortsBound: () => Outcome<void, unknown>;
}

export function isAfterPortsBoundAware(obj: unknown): obj is AfterPortsBoundAware {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'afterPortsBound' in obj &&
    typeof obj['afterPortsBound'] === 'function'
  );
}
