import { AnyParams, Id } from '../../common';
import { ModuleReferenceKey } from '../../kernel';
import { ContentType } from '../common';

export type FieldTypeSchema = {
  name: ModuleReferenceKey;
  params: AnyParams;
};

export type FieldValidatorSchema = {
  name: ModuleReferenceKey;
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
  name: Id;
  extends?: ModuleReferenceKey;
  label?: string;
  description?: string;
  type: ContentType;
  variants: ContentVariantsSchema;
  fields: FieldSchema[];
};
