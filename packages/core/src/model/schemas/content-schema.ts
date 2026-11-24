import { AnyParams } from '../../common';
import {
  CapabilityReferenceKey,
  DEFAULT_MODULE_NAME,
  id,
  Id,
  makeHiddenCollectionName,
} from '../../kernel';
import { ContentType } from '../common';

export type FieldTypeSchema = {
  name: CapabilityReferenceKey;
  params: AnyParams;
};

export type FieldValidatorSchema = {
  name: CapabilityReferenceKey;
  params: AnyParams;
};

// TODO: add default value
export type FieldSchema = {
  name: Id;
  label?: string;
  description?: string;
  example?: string;
  type: FieldTypeSchema;
  isList: boolean;
  required: boolean;
  index: boolean;
  validation: FieldValidatorSchema[];
  fields: FieldSchema[];
};

export type ContentVariantsSchema = {
  values: Id[];
  default: Id;
};

// TODO: extension mechanism for content schema (presets)
export type ContentSchema = {
  preset: Id;
  name: Id;
  extends?: CapabilityReferenceKey;
  label?: string;
  description?: string;
  type: ContentType;
  variants: ContentVariantsSchema;
  fields: FieldSchema[];
};

export function createHiddenCollectionSchema(
  contentSchema: ContentSchema,
  groupFieldSchema: FieldSchema,
): ContentSchema {
  return {
    preset: contentSchema.preset,
    name: makeHiddenCollectionName(contentSchema.name, groupFieldSchema.name),
    label: groupFieldSchema.label,
    description: groupFieldSchema.description,
    type: ContentType.COLLECTION,
    variants: contentSchema.variants,
    fields: groupFieldSchema.fields || [],
  };
}

export function getStore(contentSchema: ContentSchema): Id {
  return contentSchema.preset === DEFAULT_MODULE_NAME
    ? contentSchema.name
    : id`${contentSchema.preset}-${contentSchema.name}`;
}
