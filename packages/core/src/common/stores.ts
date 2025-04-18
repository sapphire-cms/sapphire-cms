import {ContentType} from './document';
import {ContentSchema, FieldSchema} from './content-schema.types';

export function makeHiddenCollectionName(store: string, fieldName: string): string {
  return `${store}__field-${fieldName}`;
}

export function createHiddenCollectionSchema(contentSchema: ContentSchema, groupFieldSchema: FieldSchema): ContentSchema {
  return {
    name: makeHiddenCollectionName(contentSchema.name, groupFieldSchema.name),
    type: ContentType.COLLECTION,
    variants: contentSchema.variants,
    fields: groupFieldSchema.fields || [],
  };
}
