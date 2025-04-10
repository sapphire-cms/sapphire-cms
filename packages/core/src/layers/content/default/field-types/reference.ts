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
