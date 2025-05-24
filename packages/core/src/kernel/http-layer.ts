export interface HttpLayer {
  framework: string;
}

export function isHttpLayer(obj: unknown): obj is HttpLayer {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'framework' in obj &&
    typeof obj['framework'] === 'string'
  );
}
