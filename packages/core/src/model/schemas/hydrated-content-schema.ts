import {ContentType} from '../common';
import {ContentVariantsSchema, FieldValidatorSchema} from './content-schema';
import {IFieldType} from '../common/field-type';

export type HydratedFieldSchema = {
  name: string;
  label?: string;
  description?: string;
  example?: string;
  type: IFieldType<any>;
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
