import {inject, singleton} from 'tsyringe';
import {AnyParams} from '../common';
import {DI_TOKENS} from '../kernel';
import {PersistenceLayer} from '../layers';
import {
  ContentMap,
  DeliveredArtifact,
  Document,
  DocumentContentInlined,
  DocumentMap,
  HydratedContentSchema,
  StoreMap,
  VariantMap
} from '../model';
import {CmsContext} from './cms-context';

@singleton()
export class RenderService {
  public constructor(@inject(CmsContext) private readonly cmsContext: CmsContext,
                     @inject(DI_TOKENS.PersistenceLayer) private readonly persistenceLayer: PersistenceLayer<AnyParams>) {
  }

  // FIXME: documents somehow get rendered without pipeline
  public async renderDocument(document: Document<DocumentContentInlined>, contentSchema: HydratedContentSchema, isDefaultVariant: boolean): Promise<void> {
    const pipelines = this.cmsContext.renderPipelines
        .values()
        .filter(pipeline => pipeline.contentSchema.name = contentSchema.name);

    for (const pipeline of pipelines) {
      const mainArtifact = await pipeline.renderDocument(document);

      // TODO: how to present multiple rendered versions in content map?
      const contentMap = await this.updateContentMap(document, mainArtifact, isDefaultVariant);

      await pipeline.renderStoreMap(contentMap.stores[contentSchema.name], contentSchema);
    }
  }

  private async updateContentMap(document: Document<DocumentContentInlined>, mainArtifact: DeliveredArtifact, isDefaultVariant: boolean): Promise<ContentMap> {
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
          createdAt: now,
          lastModifiedAt: now,
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
