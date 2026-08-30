import { Outcome, Program, program } from 'defectless';
import { inject, singleton } from 'tsyringe';
import {
  ArtifactMapDocument,
  ContentMapDocument,
  DocumentMapDocument,
  LocationMapDocument,
  StoreMapDocument,
  VariantMapDocument,
} from '../cms-stores';
import { AnyParams, Option } from '../common';
import { DI_TOKENS, PersistenceError } from '../kernel';
import { PersistenceLayer } from '../layers';
import {
  ArtifactMap,
  ContentLocationMap,
  ContentMap,
  ContentType,
  Document,
  DocumentContent,
  DocumentMap,
  DocumentReference,
  DocumentStatus,
  Encoding,
  ScalarValue,
  StoreMap,
  VariantMap,
} from '../model';

@singleton()
export class ContentMapService {
  constructor(
    @inject(DI_TOKENS.PersistenceLayer)
    private readonly persistenceLayer: PersistenceLayer<AnyParams>,
  ) {}

  public getContentMap(): Outcome<Option<ContentMap>, PersistenceError> {
    return program(function* (): Program<Option<ContentMap>, PersistenceError> {
      const contentMapDocOption: Option<Document<ContentMapDocument>> =
        yield this.persistenceLayer.getSingleton('content-map', 'default');

      if (Option.isNone(contentMapDocOption)) {
        return Option.none();
      }

      const contentMapDoc = contentMapDocOption.value;
      const contentMap: ContentMap = {
        version: contentMapDoc.content.version,
        createdAt: contentMapDoc.createdAt,
        lastModifiedAt: contentMapDoc.lastModifiedAt,
        stores: {},
      };

      const fetchStoreMapDocs = contentMapDoc.content.stores
        .map((ref) => DocumentReference.parse(ref))
        .map((ref) => this.persistenceLayer.getFromCollection(ref.store, ref.docId!, ref.variant!));

      const storeMapDocs: Document<StoreMapDocument>[] = yield this.fetchAll(fetchStoreMapDocs);

      for (const storeMapDoc of storeMapDocs) {
        const storeMap: StoreMap = {
          store: storeMapDoc.id,
          createdAt: storeMapDoc.createdAt,
          lastModifiedAt: storeMapDoc.lastModifiedAt,
          documents: {},
        };

        const fetchDocumentMapDocs = storeMapDoc.content.documents
          .map((ref) => DocumentReference.parse(ref))
          .map((ref) =>
            this.persistenceLayer.getFromTree(ref.store, ref.path, ref.docId!, ref.variant!),
          );

        const documentMapDocs: Document<DocumentMapDocument>[] =
          yield this.fetchAll(fetchDocumentMapDocs);

        for (const documentMapDoc of documentMapDocs) {
          const documentMap: DocumentMap = {
            docId: documentMapDoc.id,
            createdAt: documentMapDoc.createdAt,
            lastModifiedAt: documentMapDoc.lastModifiedAt,
            variants: {},
          };

          const fetchVariantMapDocs = documentMapDoc.content.variants
            .map((ref) => DocumentReference.parse(ref))
            .map((ref) =>
              this.persistenceLayer.getFromTree(ref.store, ref.path, ref.docId!, ref.variant!),
            );

          const variantMapDocs: Document<VariantMapDocument>[] =
            yield this.fetchAll(fetchVariantMapDocs);

          for (const variantMapDoc of variantMapDocs) {
            const index = ContentMapService.parseIndex(variantMapDoc.content.index);

            const variantMap: VariantMap = {
              variant: variantMapDoc.variant,
              createdAt: variantMapDoc.createdAt,
              lastModifiedAt: variantMapDoc.lastModifiedAt,
              index,
              rendered: {},
            };

            const fetchArtifactMapDocs = variantMapDoc.content.rendered
              .map((ref) => DocumentReference.parse(ref))
              .map((ref) =>
                this.persistenceLayer.getFromTree(ref.store, ref.path, ref.docId!, ref.variant!),
              );

            const artifactMapDocs: Document<ArtifactMapDocument>[] =
              yield this.fetchAll(fetchArtifactMapDocs);

            for (const artifactMapDoc of artifactMapDocs) {
              const artifactMap: ArtifactMap = {
                mime: artifactMapDoc.content.mime,
                encoding: artifactMapDoc.content.encoding as Encoding,
                createdAt: artifactMapDoc.createdAt,
                lastModifiedAt: artifactMapDoc.lastModifiedAt,
                delivered: {},
              };

              const fetchLocationMapDocs = artifactMapDoc.content.delivered
                .map((ref) => DocumentReference.parse(ref))
                .map((ref) =>
                  this.persistenceLayer.getFromTree(ref.store, ref.path, ref.docId!, ref.variant!),
                );

              const locationMapDocs: Document<LocationMapDocument>[] =
                yield this.fetchAll(fetchLocationMapDocs);

              for (const locationMapDoc of locationMapDocs) {
                const contentLocationMap: ContentLocationMap = {
                  provider: locationMapDoc.content.provider,
                  resourcePath: locationMapDoc.content.resourcePath,
                  url: locationMapDoc.content.url,
                  createdAt: artifactMapDoc.createdAt,
                  lastModifiedAt: artifactMapDoc.lastModifiedAt,
                };

                artifactMap.delivered[contentLocationMap.provider] = contentLocationMap;
              }

              variantMap.rendered[artifactMap.mime] = artifactMap;
            }

            documentMap.variants[variantMap.variant] = variantMap;
          }

          const slug = [...documentMapDoc.path, documentMapDoc.id].join('/');
          storeMap.documents[slug] = documentMap;
        }

        contentMap.stores[storeMap.store] = storeMap;
      }

      return Option.some(contentMap);
    }, this);
  }

  public updateContentMap(contentMap: ContentMap): Outcome<void, PersistenceError> {
    return program(function* (): Program<void, PersistenceError> {
      const transactionId: string = yield this.persistenceLayer.startTransaction();

      const contentMapContent: ContentMapDocument = {
        version: contentMap.version,
        stores: [],
      };

      for (const [store, storeMap] of Object.entries(contentMap.stores)) {
        const storeMapContent: StoreMapDocument = {
          documents: [],
        };

        for (const [slug, documentMap] of Object.entries(storeMap.documents)) {
          const path = slug.split('/');
          path.pop();

          const documentMapContent: DocumentMapDocument = {
            variants: [],
          };

          for (const [variant, variantMap] of Object.entries(documentMap.variants)) {
            const index: string[] = ContentMapService.serializeIndex(variantMap.index);

            const variantMapContent: VariantMapDocument = {
              index,
              rendered: [],
            };

            for (const [mime, artifactMap] of Object.entries(variantMap.rendered)) {
              const mimeId = mime.replace('/', '_');

              const artifactMapContent: ArtifactMapDocument = {
                mime,
                encoding: artifactMap.encoding,
                delivered: [],
              };

              for (const [provider, contentLocationMap] of Object.entries(artifactMap.delivered)) {
                const contentLocationMapContent: LocationMapDocument = {
                  provider,
                  resourcePath: contentLocationMap.resourcePath,
                  url: contentLocationMap.url,
                };
                const contentLocationMapDoc: Document<LocationMapDocument> = {
                  id: provider,
                  store: 'content-map-locations',
                  path: [store, ...path, documentMap.docId, variant, mimeId],
                  type: ContentType.TREE,
                  variant: 'default',
                  status: DocumentStatus.PUBLISHED,
                  createdAt: contentLocationMap.createdAt,
                  lastModifiedAt: contentLocationMap.lastModifiedAt,
                  createdBy: '',
                  content: contentLocationMapContent,
                };

                yield this.persistenceLayer.putToTree(
                  contentLocationMapDoc.store,
                  contentLocationMapDoc.path,
                  contentLocationMapDoc.id,
                  contentLocationMapDoc.variant,
                  contentLocationMapDoc,
                  transactionId,
                );

                const contentLocationMapDocRef =
                  DocumentReference.ofDocument(contentLocationMapDoc).toString();
                artifactMapContent.delivered.push(contentLocationMapDocRef);
              }

              const artifactMapDoc: Document<ArtifactMapDocument> = {
                id: mimeId,
                store: 'content-map-artifacts',
                path: [store, ...path, documentMap.docId, variant],
                type: ContentType.TREE,
                variant: 'default',
                status: DocumentStatus.PUBLISHED,
                createdAt: artifactMap.createdAt,
                lastModifiedAt: artifactMap.lastModifiedAt,
                createdBy: '',
                content: artifactMapContent,
              };

              yield this.persistenceLayer.putToTree(
                artifactMapDoc.store,
                artifactMapDoc.path,
                artifactMapDoc.id,
                artifactMapDoc.variant,
                artifactMapDoc,
                transactionId,
              );

              const artifactMapDocRef = DocumentReference.ofDocument(artifactMapDoc).toString();
              variantMapContent.rendered.push(artifactMapDocRef);
            }

            const variantMapDoc: Document<VariantMapDocument> = {
              id: variant,
              store: 'content-map-variants',
              path: [store, ...path, documentMap.docId],
              type: ContentType.TREE,
              variant: 'default',
              status: DocumentStatus.PUBLISHED,
              createdAt: variantMap.createdAt,
              lastModifiedAt: variantMap.lastModifiedAt,
              createdBy: '',
              content: variantMapContent,
            };

            yield this.persistenceLayer.putToTree(
              variantMapDoc.store,
              variantMapDoc.path,
              variantMapDoc.id,
              variantMapDoc.variant,
              variantMapDoc,
              transactionId,
            );

            const variantMapDocRef = DocumentReference.ofDocument(variantMapDoc).toString();
            documentMapContent.variants.push(variantMapDocRef);
          }

          const documentMapDoc: Document<DocumentMapDocument> = {
            id: documentMap.docId,
            store: 'content-map-documents',
            path,
            type: ContentType.TREE,
            variant: 'default',
            status: DocumentStatus.PUBLISHED,
            createdAt: documentMap.createdAt,
            lastModifiedAt: documentMap.lastModifiedAt,
            createdBy: '',
            content: documentMapContent,
          };

          yield this.persistenceLayer.putToTree(
            documentMapDoc.store,
            documentMapDoc.path,
            documentMapDoc.id,
            documentMapDoc.variant,
            documentMapDoc,
            transactionId,
          );

          const documentMapDocRef = DocumentReference.ofDocument(documentMapDoc).toString();
          storeMapContent.documents.push(documentMapDocRef);
        }

        const storeMapDoc: Document<StoreMapDocument> = {
          id: store,
          store: 'content-map-stores',
          path: [],
          type: ContentType.COLLECTION,
          variant: 'default',
          status: DocumentStatus.PUBLISHED,
          createdAt: storeMap.createdAt,
          lastModifiedAt: storeMap.lastModifiedAt,
          createdBy: '',
          content: storeMapContent,
        };

        yield this.persistenceLayer.putToCollection(
          storeMapDoc.store,
          storeMapDoc.id,
          storeMapDoc.variant,
          storeMapDoc,
          transactionId,
        );

        const storeMapDocRef = DocumentReference.ofDocument(storeMapDoc).toString();
        contentMapContent.stores.push(storeMapDocRef);
      }

      const contentMapDoc: Document<ContentMapDocument> = {
        id: 'content-map',
        store: 'content-map',
        path: [],
        type: ContentType.SINGLETON,
        variant: 'default',
        status: DocumentStatus.PUBLISHED,
        createdAt: contentMap.createdAt,
        lastModifiedAt: contentMap.lastModifiedAt,
        createdBy: '',
        content: contentMapContent,
      };
      yield this.persistenceLayer.putSingleton(
        contentMapDoc.id,
        contentMapDoc.variant,
        contentMapDoc,
        transactionId,
      );

      yield this.persistenceLayer.completeTransaction(transactionId);
    }, this);
  }

  private fetchAll<T extends DocumentContent>(
    fetchTasks: Outcome<Option<Document>, PersistenceError>[],
  ): Outcome<Document<T>[], PersistenceError> {
    return Outcome.all(fetchTasks)
      .map((options) =>
        options
          .filter((option) => Option.isSome(option))
          .map((option) => option.value as unknown as Document<T>),
      )
      .mapFailure((errors: (PersistenceError | undefined)[]) => {
        const message = errors
          .filter((error) => !!error)
          .map((error) => error!.message)
          .join('\n');
        return new PersistenceError(message);
      });
  }

  private static parseIndex(input: string[]): {
    [field: string]: string | number | boolean | (string | number | boolean)[];
  } {
    const result: Record<string, ScalarValue | ScalarValue[]> = {};

    for (const entry of input) {
      const [field, rawValue, type] = entry.split(':');

      let value: ScalarValue;

      switch (type) {
        case 'string':
          value = rawValue;
          break;
        case 'number':
          value = Number(rawValue);
          break;
        case 'boolean':
          value = rawValue === 'true';
          break;
      }

      const existing = result[field];

      if (existing === undefined) {
        result[field] = value!;
      } else if (Array.isArray(existing)) {
        existing.push(value!);
      } else {
        result[field] = [existing, value!];
      }
    }

    return result;
  }

  private static serializeIndex(index: {
    [field: string]: string | number | boolean | (string | number | boolean)[];
  }): string[] {
    const result: string[] = [];

    const serialize = (field: string, value: string | number | boolean): void => {
      result.push(`${field}:${value}:${typeof value}`);
    };

    for (const [field, value] of Object.entries(index)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          serialize(field, item);
        }
      } else {
        serialize(field, value);
      }
    }

    return result;
  }
}
