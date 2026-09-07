import { SapphireModule } from '@sapphire-cms/core';
import { CodegenRenderLayer } from './codegen-render.layer';
import { CodegenShaperLayer } from './codegen-shaper.layer';

@SapphireModule({
  name: 'codegen',
  params: [] as const,
  layers: {
    render: CodegenRenderLayer,
    shaper: CodegenShaperLayer,
  },
})
export default class CodegenModule {}
