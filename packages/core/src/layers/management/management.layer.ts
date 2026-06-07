import { AnyParams, Option } from '../../common';
import {
  AfterPortsBoundAware,
  AuthorizationError,
  HttpLayer,
  Layer,
  OuterError,
  Port,
  Credential,
} from '../../kernel';
import {
  ContentSchema,
  Document,
  DocumentContent,
  DocumentInfo,
  DocumentReference,
  HydratedContentSchema,
  InvalidDocumentError,
  MissingDocIdError,
  MissingDocumentError,
  UnknownContentTypeError,
  UnsupportedContentVariant,
  MediaAsset,
  MediaDocumentContent,
  BranchInfo,
  UnsupportedContentTypeError,
  UploadedMediaAsset,
  AssetUrl,
} from '../../model';

export interface ManagementLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config>,
    HttpLayer,
    AfterPortsBoundAware {
  getHydratedContentSchemasPort: Port<
    (credential?: Credential) => HydratedContentSchema[],
    AuthorizationError
  >;
  getContentSchemasPort: Port<(credential?: Credential) => ContentSchema[], AuthorizationError>; // returns normal content schemas without methods. Useful for HTTP API
  getHydratedContentSchemaPort: Port<
    (store: string, credential?: Credential) => Option<HydratedContentSchema>,
    AuthorizationError
  >;
  getContentSchemaPort: Port<
    (store: string, credential?: Credential) => Option<ContentSchema>,
    AuthorizationError
  >; // returns normal content schema without methods. Useful for HTTP API

  listDocumentsPort: Port<
    (store: string, credential?: Credential) => DocumentInfo[],
    UnknownContentTypeError | OuterError | AuthorizationError
  >;
  listFromTreePath: Port<
    (store: string, path: string[], credential?: Credential) => (DocumentInfo | BranchInfo)[],
    UnknownContentTypeError | UnsupportedContentTypeError | OuterError | AuthorizationError
  >;
  getDocumentPort: Port<
    (docRef: DocumentReference, credential?: Credential) => Option<Document>,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | OuterError
    | AuthorizationError
  >;

  startTransactionPort: Port<() => string, OuterError | AuthorizationError>;
  completeTransactionPort: Port<(transactionId: string) => void, OuterError | AuthorizationError>;
  abortTransactionPort: Port<(transactionId: string) => void, OuterError | AuthorizationError>;

  // TODO: validate document reference
  putDocumentPort: Port<
    (
      docRef: DocumentReference,
      content: DocumentContent,
      transactionId?: string,
      credential?: Credential,
    ) => Document,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | InvalidDocumentError
    | OuterError
    | AuthorizationError
  >;
  deleteDocumentPort: Port<
    (
      docRef: DocumentReference,
      transactionId?: string,
      credential?: Credential,
    ) => Option<Document>,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | OuterError
    | AuthorizationError
  >;
  publishDocumentPort: Port<
    (docRef: DocumentReference, credential?: Credential) => void,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | MissingDocumentError
    | OuterError
    | AuthorizationError
  >;

  uploadMediaPort: Port<
    (mediaAsset: MediaAsset, credential?: Credential) => Document<MediaDocumentContent>,
    OuterError | AuthorizationError
  >;
  // TODO: move into public layer
  mediaThumbnailPort: Port<
    (path: string[], mediaId: string, credential?: Credential) => UploadedMediaAsset | AssetUrl,
    MissingDocumentError | OuterError | AuthorizationError
  >;
  deleteMediaPort: Port<
    (
      path: string[],
      mediaId: string,
      credential?: Credential,
    ) => Option<Document<MediaDocumentContent>>,
    OuterError | AuthorizationError
  >;
}
