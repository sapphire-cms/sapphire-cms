import { AnyParams } from '../../common';
import { CapabilityReferenceKey, Id } from '../../kernel';

export type FieldShaperSchema = {
  fieldShaper: CapabilityReferenceKey;
  params: AnyParams;
};

export type FieldPipelineSchema = {
  source: Id;
  target: Id;
  shapers: FieldShaperSchema[];
};

export type ShaperSchema = {
  name: Id;
  for: CapabilityReferenceKey;
  fields: FieldPipelineSchema[];
};
