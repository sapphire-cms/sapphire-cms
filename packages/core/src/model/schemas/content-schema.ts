import { AnyParams } from '../../common';
import { ContentType } from '../common';

export type FieldTypeSchema = {
  name: string;
  params: AnyParams;
};

export type FieldValidatorSchema = {
  name: string;
  params: AnyParams;
};

export type FieldSchema = {
  name: string;
  label?: string;
  description?: string;
  example?: string;
  type: FieldTypeSchema;
  isList: boolean;
  required: boolean;
  validation: FieldValidatorSchema[];
  fields: FieldSchema[];
};

export type ContentVariantsSchema = {
  values: string[];
  default: string;
};

// TODO: extention mechanism for content sschema (presets)
export type ContentSchema = {
  name: string;
  extends?: string;
  label?: string;
  description?: string;
  type: ContentType;
  variants: ContentVariantsSchema;
  fields: FieldSchema[];
};
