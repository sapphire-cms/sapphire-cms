import { AnyParams } from '../../common';

export type FieldShaperSchema = {
  fieldShaper: string;
  params: AnyParams;
};

export type FieldPipelineSchema = {
  source: string;
  target: string;
  shapers: FieldShaperSchema[];
};

export type ShaperSchema = {
  name: string;
  for: string;
  fields: FieldPipelineSchema[];
};
