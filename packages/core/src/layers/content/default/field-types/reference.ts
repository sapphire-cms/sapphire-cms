import {SapphireFieldType} from '../../fields-typing';
import {AbstractReference} from './abstract-reference';

@SapphireFieldType({
  name: 'reference',
  castTo: 'string',
  example: 'docs:core/field-types/tag:ru',
  paramDefs: [
    {
      name: 'store',
      description: 'Authorized store for the reference.',
      type: 'string',
    }
  ] as const,
})
export class Reference extends AbstractReference {
  constructor(params: { store: string; }) {
    super(params);
  }
}

export type ReferenceObj = {
  store: string;
  path: string[];
  docId: string;
  variant?: string;
};

export function createReferenceString(store: string, path: string[], docId: string, variant?: string): string {
  let ref = store + ':';
  ref += [ ...path, docId ].join('/');
  ref += variant? ':' + variant : '';
  return ref;
}

export function parseReferenceString(str: string): ReferenceObj {
  const parts = str.split(':');
  const store = parts[0];
  const path = parts[1].split('/');
  const docId = path.pop()!;
  const variant = parts[2];

  return { store, path, docId, variant };
}
