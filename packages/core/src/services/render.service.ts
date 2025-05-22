import { Outcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { AnyParams, Option } from '../common';
import { DeliveryError, DI_TOKENS, PersistenceError, RenderError } from '../kernel';
import { PersistenceLayer } from '../layers';
import {
  ContentMap,
  DeliveredArtifact,
  Document,
  DocumentContentInlined,
  DocumentMap,
  HydratedContentSchema,
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

  // FIXME: documents somehow get rendered without pipeline
  public renderDocument(
    document: Document<DocumentContentInlined>,
    contentSchema: HydratedContentSchema,
    isDefaultVariant: boolean,
  ): Outcome<void, RenderError | PersistenceError | DeliveryError> {
    const pipelines = this.cmsContext.renderPipelines
      .values()
      .filter((pipeline) => (pipeline.contentSchema.name = contentSchema.name));

    const renderTasks = pipelines.map((pipeline) =>
      pipeline
        .renderDocument(document)
        .flatMap((mainArtifact) => this.updateContentMap(document, mainArtifact, isDefaultVariant))
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

        const slug = [...document.path, document.id].join('/');
        const documentMap: DocumentMap = (storeMap.documents[slug] ||= {
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

        return contentMap;
      })
      .through(this.persistenceLayer.updateContentMap);
  }
}
