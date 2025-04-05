export interface AfterInit {
  afterInit: () => Promise<void>;
}

export function isAfterInit(obj: unknown): obj is AfterInit {
  return (
      typeof obj === 'object' &&
      obj !== null &&
      'afterInit' in obj &&
      typeof (obj as any).afterInit === 'function'
  );
}

