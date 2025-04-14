import {Document} from '../common';
import {DI_TOKENS} from '../kernel';
import {inject, singleton} from 'tsyringe';
import {DeliveryLayer, getRendererMetadataFromClass, RenderLayer, SapphireRendererClass} from '../layers';

@singleton()
export class RenderService {
  private readonly rendererFactories = new Map<string, SapphireRendererClass<any>>();

  public constructor(@inject(DI_TOKENS.RenderLayer) renderLayer: RenderLayer<any>,
                     @inject(DI_TOKENS.DeliveryLayersMap) private readonly deliveryLayersMap: Map<string, DeliveryLayer<any>>) {
    for (const rendererFactory of renderLayer.rendererFactories || []) {
      const metadata = getRendererMetadataFromClass(rendererFactory);
      if (metadata) {
        this.rendererFactories.set(metadata.name, rendererFactory);
      }
    }
  }

  public async renderDocument(document: Document<any>): Promise<void> {
    const renderer = new (this.rendererFactories.get('yaml')!)();
    const rendered = await renderer.renderDocument(document);
    return this.deliveryLayersMap.get('node')!.deliverContent(rendered);
  }
}
