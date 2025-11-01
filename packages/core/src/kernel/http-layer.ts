import { Framework } from './framework';

export interface HttpLayer {
  framework: Framework;
}

export function isHttpLayer(obj: unknown): obj is HttpLayer {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'framework' in obj &&
    typeof obj['framework'] === 'string'
  );
}
