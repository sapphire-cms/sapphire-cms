import { SapphireModule } from '@sapphire-cms/core';
import { CodegenRenderLayer } from './codegen-render.layer';

@SapphireModule({
  name: 'codegen',
  params: [] as const,
  layers: {
    render: CodegenRenderLayer,
  },
})
export default class CodegenModule {}
