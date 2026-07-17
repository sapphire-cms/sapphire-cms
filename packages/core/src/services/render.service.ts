import { Outcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { AnyParams, Option } from '../common';
import { DeliveryError, DI_TOKENS, PersistenceError, RenderError } from '../kernel';
import { PersistenceLayer } from '../layers';
import {
  ArtifactMap,
  ContentMap,
  DeliveredArtifact,
  Document,
  DocumentContentInlined,
  DocumentMap,
  HydratedContentSchema,
  ScalarValue,
  StoreMap,
  VariantMap,
} from '../model';
import { CmsContext } from './cms-context';

@singleton()
export class RenderService {
  constructor(
    @inject(CmsContext) private readonly cmsContext: CmsContext,
    @inject(DI_TOKENS.PersistenceLayer)
    private readonly persistenceLayer: PersistenceLayer<AnyParams>,
  ) {}

  public renderDocument(
    document: Document<DocumentContentInlined>,
    contentSchema: HydratedContentSchema,
    isDefaultVariant: boolean,
  ): Outcome<void, RenderError | PersistenceError | DeliveryError> {
    const pipelines = this.cmsContext.renderPipelines
      .values()
      .filter((pipeline) => pipeline.contentSchema.name === contentSchema.name);

    const renderTasks = pipelines.map((pipeline) =>
      pipeline
        .renderDocument(document)
        .flatMap((mainArtifact) =>
          this.updateContentMap(document, contentSchema, mainArtifact, isDefaultVariant),
        )
        .flatMap((contentMap) =>
          pipeline.renderStoreMap(contentMap.stores[contentSchema.name], contentSchema),
        ),
    );

    return Outcome.all([...renderTasks])
      .map(() => {})
      .mapFailure((errors) => {
        // TODO: find a cleaner solution. Do not swallow the errors
        return errors.filter((error) => !!error)[0];
      });
  }

  private updateContentMap(
    document: Document<DocumentContentInlined>,
    contentSchema: HydratedContentSchema,
    mainArtifact: DeliveredArtifact,
    isDefaultVariant: boolean,
  ): Outcome<ContentMap, PersistenceError> {
    const now = new Date().toISOString();

    return this.persistenceLayer
      .getContentMap()
      .map((optionalContentMap) => {
        const contentMap: ContentMap = Option.isSome(optionalContentMap)
          ? optionalContentMap.value
          : {
              createdAt: now,
              lastModifiedAt: now,
              stores: {},
            };

        contentMap.lastModifiedAt = now;

        const storeMap: StoreMap = (contentMap.stores[document.store] ||= {
          store: document.store,
          createdAt: now,
          lastModifiedAt: now,
          documents: {},
        });
        storeMap.lastModifiedAt = now;

        const slug = [...document.path, document.id].join('/');
        const documentMap: DocumentMap = (storeMap.documents[slug] ||= {
          docId: document.id,
          createdAt: now,
          lastModifiedAt: now,
          variants: {},
        });
        documentMap.lastModifiedAt = now;

        const index = RenderService.extractIndexedFields(document, contentSchema);

        const variantMap: VariantMap = (documentMap.variants[document.variant] ||= {
          variant: document.variant,
          createdAt: now,
          lastModifiedAt: now,
          index,
          rendered: {},
        });
        variantMap.lastModifiedAt = now;

        if (isDefaultVariant) {
          documentMap.variants.default = variantMap;
        }

        const artifactMap: ArtifactMap = (variantMap.rendered[mainArtifact.mime] ||= {
          mime: mainArtifact.mime,
          createdAt: now,
          lastModifiedAt: now,
          delivered: {},
        });
        artifactMap.lastModifiedAt = now;

        const contentLocationMap = (artifactMap.delivered[mainArtifact.provider] ||= {
          provider: mainArtifact.provider,
          createdAt: now,
          lastModifiedAt: now,
        });

        contentLocationMap.resourcePath =
          'resourcePath' in mainArtifact ? mainArtifact.resourcePath : undefined;
        contentLocationMap.url = 'url' in mainArtifact ? mainArtifact.url : undefined;
        contentLocationMap.lastModifiedAt = now;

        return contentMap;
      })
      .through((contentMap) => this.persistenceLayer.updateContentMap(contentMap));
  }

  // TODO: extract indexed fields from groups
  private static extractIndexedFields(
    document: Document<DocumentContentInlined>,
    contentSchema: HydratedContentSchema,
  ): { [field: string]: ScalarValue | ScalarValue[] } {
    const index: {
      [field: string]: ScalarValue | ScalarValue[];
    } = {};

    for (const fieldConfig of contentSchema.fields.filter((f) => f.index)) {
      if (document.content[fieldConfig.name]) {
        index[fieldConfig.name] = document.content[fieldConfig.name] as ScalarValue;
      }
    }

    return index;
  }
}
