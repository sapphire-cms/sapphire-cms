import { Outcome, Program, program } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { Option } from '../common';
import { AfterInitAware, DI_TOKENS, MediaError, PersistenceError } from '../kernel';
import { ManagementLayer, MediaLayer, PersistenceLayer } from '../layers';
import {
  ContentType,
  Document,
  DocumentReference,
  DocumentStatus,
  MediaAsset,
  MediaDocumentContent,
  MediaMetadataDocumentContent,
  UploadedMediaAsset,
} from '../model';
import { ContentService } from './content.service';
import { SecureManagementLayer } from './secure-management.layer';

const mediaStore = 'smc-media';
const mediaMetadataStore = 'cms-media__metadata';
const variant = 'default';

@singleton()
export class MediaService implements AfterInitAware {
  constructor(
    @inject(SecureManagementLayer) private readonly managementLayer: ManagementLayer,
    @inject(ContentService) private readonly contentService: ContentService,
    @inject(DI_TOKENS.PersistenceLayer) private readonly persistenceLayer: PersistenceLayer,
    @inject(DI_TOKENS.MediaLayer) private readonly mediaLayer: MediaLayer,
  ) {
    this.managementLayer.uploadMediaPort.accept((mediaAsset: MediaAsset) => {
      return this.uploadMedia(mediaAsset);
    });

    this.managementLayer.deleteMediaPort.accept((mediaDocRef: DocumentReference) => {
      return this.deleteMedia(mediaDocRef);
    });
  }

  public afterInit(): Outcome<void, MediaError> {
    return this.mediaLayer.prepareMediaRepo();
  }

  public uploadMedia(
    mediaAsset: MediaAsset,
  ): Outcome<Document<MediaDocumentContent>, MediaError | PersistenceError> {
    return program(function* (): Program<
      Document<MediaDocumentContent>,
      MediaError | PersistenceError
    > {
      const uploadedAsset: UploadedMediaAsset = yield this.mediaLayer.uploadAsset(mediaAsset);

      const path = uploadedAsset.slug.split('/');
      const docId = path.pop()!;

      const now = new Date().toISOString();

      const metadataRefs: string[] = [];

      for (const [key, value] of Object.entries(uploadedAsset.metadata)) {
        const metaDocId = `${docId}_${key}`;

        const metadataDocument: Document<MediaMetadataDocumentContent> = {
          id: metaDocId,
          store: mediaMetadataStore,
          path: [],
          type: ContentType.COLLECTION,
          variant,
          status: DocumentStatus.PUBLISHED,
          createdAt: now,
          lastModifiedAt: now,
          createdBy: '', // to be redefined in persistence layer
          content: { key, value },
        };

        yield this.persistenceLayer.putToCollection(
          mediaMetadataStore,
          metaDocId,
          variant,
          metadataDocument,
        );

        const metaDocRef = new DocumentReference(mediaMetadataStore, [], metaDocId, variant);

        metadataRefs.push(metaDocRef.toString());
      }

      const docContent: MediaDocumentContent = {
        type: uploadedAsset.type,
        provider: uploadedAsset.provider,
        providerRef: uploadedAsset.providerRef,
        mimeType: uploadedAsset.mimeType,
        sizeInBytes: uploadedAsset.properties.sizeInBytes,
        width: uploadedAsset.properties.width,
        height: uploadedAsset.properties.height,
        durationInMs: uploadedAsset.properties.durationInMs,
        title: uploadedAsset.properties.title,
        alt: uploadedAsset.properties.alt,
        caption: uploadedAsset.properties.caption,
        metadata: metadataRefs,
      };

      const mediaDocument: Document<MediaDocumentContent> = {
        id: docId,
        store: mediaStore,
        path,
        type: ContentType.TREE,
        variant,
        status: DocumentStatus.PUBLISHED,
        createdAt: now,
        lastModifiedAt: now,
        createdBy: '', // to be redefined in persistence layer
        content: docContent,
      };

      return this.persistenceLayer.putToTree(
        mediaStore,
        path,
        docId,
        variant,
        mediaDocument,
      ) as Outcome<Document<MediaDocumentContent>, PersistenceError>;
    }, this);
  }

  public deleteMedia(
    mediaDocRef: DocumentReference,
  ): Outcome<Option<Document<MediaDocumentContent>>, MediaError | PersistenceError> {
    return program(function* (): Program<
      Option<Document<MediaDocumentContent>>,
      MediaError | PersistenceError
    > {
      const mediaDocOption: Option<Document<MediaDocumentContent>> =
        yield this.contentService.deleteDocument(mediaDocRef) as Outcome<
          Option<Document<MediaDocumentContent>>,
          PersistenceError
        >;

      if (Option.isSome(mediaDocOption)) {
        // TODO: ensure that provider name match
        yield this.mediaLayer.deleteAsset(mediaDocOption.value.content.providerRef);
      }

      return mediaDocOption;
    }, this);
  }
}
