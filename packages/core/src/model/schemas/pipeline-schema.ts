import { AnyParams, Id } from '../../common';
import { ModuleReferenceKey } from '../../kernel';

export type PipelineRenderer = {
  name: ModuleReferenceKey;
  params: AnyParams;
};

export type PipelineSchema = {
  name: Id;
  source: ModuleReferenceKey;
  target: ModuleReferenceKey;
  shapers: ModuleReferenceKey[];
  render: PipelineRenderer;
};
