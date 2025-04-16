import {ContentMap, DeliveredArtifact, Document, DocumentMap, StoreMap, VariantMap} from '../common';
import {DI_TOKENS} from '../kernel';
import {inject, singleton} from 'tsyringe';
import {
  DeliveryLayer,
  getRendererMetadataFromClass,
  PersistenceLayer,
  RenderLayer,
  SapphireRendererClass
} from '../layers';
import {FieldTypeService} from './field-type.service';
import {ContentSchema} from '../loadables';

@singleton()
export class RenderService {
  private readonly rendererFactories = new Map<string, SapphireRendererClass<any>>();

  public constructor(@inject(FieldTypeService) private readonly fieldTypeService: FieldTypeService,
                     @inject(DI_TOKENS.PersistenceLayer) private readonly persistenceLayer: PersistenceLayer<any>,
                     @inject(DI_TOKENS.RenderLayer) renderLayer: RenderLayer<any>,
                     @inject(DI_TOKENS.DeliveryLayersMap) private readonly deliveryLayersMap: Map<string, DeliveryLayer<any>>) {
    for (const rendererFactory of renderLayer.rendererFactories || []) {
      const metadata = getRendererMetadataFromClass(rendererFactory);
      if (metadata) {
        this.rendererFactories.set(metadata.name, rendererFactory);
      }
    }
  }

  public async renderDocument(document: Document<any>, isDefaultVariant: boolean, contentSchemas: ContentSchema[]): Promise<void> {
    const renderer = new (this.rendererFactories.get('typescript')!)();
    const deliveryLayer = this.deliveryLayersMap.get('node')!
    const artifacts = await renderer.renderDocument(document);

    const main = artifacts.filter(artifact => artifact.isMain);
    if (!main.length) {
      throw new Error('Renderer must produce one main artifact.');
    } else if (main.length > 1) {
      throw new Error('Renderer cannot produce multiple main artifacts.');
    }

    for (const artifact of artifacts) {
      const deliveredArtifact = await deliveryLayer.deliverArtefact(artifact);
      if (artifact.isMain) {
        const contentMap = await this.updateContentMap(document, deliveredArtifact, isDefaultVariant);
        const contentMapArtifacts = await renderer.renderContentMap(
            contentMap,
            contentSchemas,
            this.fieldTypeService.fieldTypeFactories);

        await Promise.all(
            contentMapArtifacts
                .map(mapArtifact => deliveryLayer.deliverArtefact(mapArtifact)));
      }
    }
  }

  private async updateContentMap(document: Document<any>, mainArtifact: DeliveredArtifact, isDefaultVariant: boolean): Promise<ContentMap> {
    let contentMap = await this.persistenceLayer.getContentMap();

    const now = new Date().toISOString();

    if (!contentMap) {
      contentMap = {
        createdAt: now,
        lastModifiedAt: now,
        stores: {},
      };
    } else {
      contentMap.lastModifiedAt = now;
    }

    const storeMap: StoreMap = (
        contentMap.stores[document.store] ||= {
          store: document.store,
          documents: {},
        });

    const slug = [ ...document.path, document.id ].join('/');
    const documentMap: DocumentMap = (
        storeMap.documents[slug] ||= {
          docId: document.id,
          variants: {
            default: undefined,
          },
        });

    const variantMap: VariantMap = (documentMap.variants[document.variant] ||= {
      variant: document.variant,
      resourcePath: mainArtifact.resourcePath,
      mime: mainArtifact.mime,
      createdAt: now,
      lastModifiedAt: now,
    });

    variantMap.lastModifiedAt = now;

    if (isDefaultVariant) {
      documentMap.variants.default = variantMap;
    }

    await this.persistenceLayer.updateContentMap(contentMap);
    return contentMap;
  }
}
