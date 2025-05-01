import {ContentType, IFieldType} from '../common';
import {ContentVariantsSchema, FieldValidatorSchema} from './content-schema';

export type HydratedFieldSchema = {
  name: string;
  label?: string;
  description?: string;
  example?: string;
  type: IFieldType;
  isList: boolean;
  required: boolean;
  validation: FieldValidatorSchema[],
  fields: HydratedFieldSchema[],
};

export type HydratedContentSchema = {
  name: string;
  extends?: string;
  label?: string;
  description?: string;
  type: ContentType;
  variants: ContentVariantsSchema;
  fields: HydratedFieldSchema[];
};
