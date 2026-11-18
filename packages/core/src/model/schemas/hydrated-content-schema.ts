import { CapabilityReference, Id } from '../../kernel';
import { ContentType, IFieldType, IFieldValidator } from '../common';
import { ContentVariantsSchema } from './content-schema';

export type HydratedFieldSchema = {
  name: Id;
  label?: string;
  description?: string;
  example?: string;
  type: IFieldType;
  isList: boolean;
  required: boolean;
  index: boolean;
  validation: IFieldValidator[];
  fields: HydratedFieldSchema[];
};

export type HydratedContentSchema = {
  ref: CapabilityReference;
  extends?: CapabilityReference;
  label?: string;
  description?: string;
  type: ContentType;
  variants: ContentVariantsSchema;
  fields: HydratedFieldSchema[];
};
