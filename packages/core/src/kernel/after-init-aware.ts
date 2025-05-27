import { Outcome } from 'defectless';

/**
 * Running after component was instantiated but before ports were bound.
 * Suitable for initialization logic.
 */
export interface AfterInitAware {
  afterInit: () => Outcome<void, unknown>;
}

export function isAfterInitAware(obj: unknown): obj is AfterInitAware {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'afterInit' in obj &&
    typeof obj['afterInit'] === 'function'
  );
}
