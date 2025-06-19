import { ContentType } from '../common';
import { ContentSchema, FieldSchema } from '../schemas';

export function makeHiddenCollectionName(store: string, fieldName: string): string {
  return `${store}__field-${fieldName}`;
}

export function createHiddenCollectionSchema(
  contentSchema: ContentSchema,
  groupFieldSchema: FieldSchema,
): ContentSchema {
  return {
    name: makeHiddenCollectionName(contentSchema.name, groupFieldSchema.name),
    label: groupFieldSchema.label,
    description: groupFieldSchema.description,
    type: ContentType.COLLECTION,
    variants: contentSchema.variants,
    fields: groupFieldSchema.fields || [],
  };
}
