import { AnyParams } from '../../common';
import { ModuleReferenceKey, Id, CapabilityReferenceKey } from '../../kernel';

export type PipelineRenderer = {
  name: CapabilityReferenceKey;
  params: AnyParams;
};

export type PipelineSchema = {
  name: Id;
  source: CapabilityReferenceKey;
  target: ModuleReferenceKey;
  shapers: CapabilityReferenceKey[];
  render: PipelineRenderer;
};
