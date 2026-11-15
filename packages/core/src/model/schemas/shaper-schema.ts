import { AnyParams, Id } from '../../common';
import { ModuleReferenceKey } from '../../kernel';

export type FieldShaperSchema = {
  fieldShaper: ModuleReferenceKey;
  params: AnyParams;
};

export type FieldPipelineSchema = {
  source: Id;
  target: Id;
  shapers: FieldShaperSchema[];
};

export type ShaperSchema = {
  name: Id;
  for: ModuleReferenceKey;
  fields: FieldPipelineSchema[];
};
