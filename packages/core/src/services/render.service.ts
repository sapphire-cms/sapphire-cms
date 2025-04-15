import {DeliveredArtifact, Document} from '../common';
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
    const deliveryLayer = this.deliveryLayersMap.get('node')!
    const artifacts = await renderer.renderDocument(document);

    for (const artifact of artifacts) {
      const deliveredArtifact = await deliveryLayer.deliverArtefact(artifact);
      if (artifact.isMain) {
        await this.updateContentMap(document, deliveredArtifact);
      }
    }
  }

  private async updateContentMap(document: Document<any>, documentArtifact: DeliveredArtifact): Promise<void> {
    const deliveryLayer = this.deliveryLayersMap.get('node')!
    let contentMap = await deliveryLayer.fetchContentMap();

    const now = new Date().toISOString();

    if (!contentMap) {
      contentMap = {
        store: document.store,
        createdAt: now,
        lastModifiedAt: now,
        documents: [],
      };
    } else {
      contentMap.lastModifiedAt = now;
    }

    const existingDocument = contentMap.documents
        .filter(doc => doc.slug === documentArtifact.slug);

    if (existingDocument.length) {
      existingDocument[0].resources = [
        {
          resourcePath: documentArtifact.resourcePath,
          mime: documentArtifact.mime,
          createdAt: documentArtifact.createdAt,
          lastModifiedAt: documentArtifact.lastModifiedAt,
        }
      ];
    } else {
      contentMap.documents.push({
        slug: documentArtifact.slug,
        resources: [
          {
            resourcePath: documentArtifact.resourcePath,
            mime: documentArtifact.mime,
            createdAt: documentArtifact.createdAt,
            lastModifiedAt: documentArtifact.lastModifiedAt,
          }
        ],
      });
    }

    return deliveryLayer.updateContentMap(contentMap);
  }
}
