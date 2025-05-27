import { ContentType, IFieldType, IFieldValidator } from '../common';
import { ContentVariantsSchema } from './content-schema';

export type HydratedFieldSchema = {
  name: string;
  label?: string;
  description?: string;
  example?: string;
  type: IFieldType;
  isList: boolean;
  required: boolean;
  validation: IFieldValidator[];
  fields: HydratedFieldSchema[];
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
