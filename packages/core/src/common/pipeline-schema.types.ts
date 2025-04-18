export type PipelineRendererParams = Record<
    string,
    string
    | number
    | boolean
    | (string | number | boolean)[]
>;

export type PipelineRenderer = {
  name: string;
  params: PipelineRendererParams;
};

export type PipelineSchema = {
  name: string;
  source: string;
  target: string;
  shapers: string[];
  render: PipelineRenderer;
};
