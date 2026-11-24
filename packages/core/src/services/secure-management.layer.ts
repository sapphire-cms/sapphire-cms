import { Outcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { Option } from '../common';
import {
  AuthorizationError,
  BranchInfo,
  CapabilityReference,
  Credential,
  DI_TOKENS,
  DocumentReference,
  Framework,
  Id,
  OuterError,
  Port,
} from '../kernel';
import { ManagementLayer } from '../layers';
import {
  AssetUrl,
  Document,
  DocumentContent,
  DocumentInfo,
  DocumentShapingError,
  HydratedContentSchema,
  InvalidDocumentError,
  MediaAsset,
  MediaDocumentContent,
  MissingDocIdError,
  MissingDocumentError,
  UnknownContentTypeError,
  UnsupportedContentTypeError,
  UnsupportedContentVariant,
  UploadedMediaAsset,
} from '../model';
import { SecurityService } from './security.service';

@singleton()
export class SecureManagementLayer implements ManagementLayer {
  public readonly framework: Framework;
  public readonly listContentSchemasPort: Port<
    (credential?: Credential) => HydratedContentSchema[],
    AuthorizationError
  >;
  public readonly getContentSchemaPort: Port<
    (schemaRef: CapabilityReference, credential?: Credential) => Option<HydratedContentSchema>,
    AuthorizationError
  >;
  public readonly getStoreContentSchemaPort: Port<
    (store: Id, credential?: Credential) => Option<HydratedContentSchema>,
    AuthorizationError
  >;

  public readonly listDocumentsPort: Port<
    (store: string, credential?: Credential) => DocumentInfo[],
    UnknownContentTypeError | OuterError | AuthorizationError
  >;
  public readonly listFromTreePath: Port<
    (store: string, path: string[], credential?: Credential) => (DocumentInfo | BranchInfo)[],
    UnknownContentTypeError | UnsupportedContentTypeError | OuterError | AuthorizationError
  >;
  public readonly getDocumentPort: Port<
    (docRef: DocumentReference, credential?: Credential) => Option<Document>,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | OuterError
    | AuthorizationError
  >;

  public startTransactionPort: Port<() => string, OuterError | AuthorizationError>;
  public completeTransactionPort: Port<
    (transactionId: string) => void,
    OuterError | AuthorizationError
  >;
  public abortTransactionPort: Port<
    (transactionId: string) => void,
    OuterError | AuthorizationError
  >;

  public readonly putDocumentPort: Port<
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
    | DocumentShapingError
    | OuterError
    | AuthorizationError
  >;
  public readonly deleteDocumentPort: Port<
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
  public readonly publishDocumentPort: Port<
    (docRef: DocumentReference, credential?: Credential) => void,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | MissingDocumentError
    | DocumentShapingError
    | OuterError
    | AuthorizationError
  >;

  public readonly uploadMediaPort: Port<
    (mediaAsset: MediaAsset, credential?: Credential) => Document<MediaDocumentContent>,
    OuterError | AuthorizationError
  >;
  public readonly mediaThumbnailPort: Port<
    (path: string[], mediaId: string, credential?: Credential) => UploadedMediaAsset | AssetUrl,
    MissingDocumentError | OuterError | AuthorizationError
  >;
  public readonly deleteMediaPort: Port<
    (
      path: string[],
      mediaId: string,
      credential?: Credential,
    ) => Option<Document<MediaDocumentContent>>,
    OuterError | AuthorizationError
  >;

  constructor(
    @inject(DI_TOKENS.ManagementLayer) private readonly delegate: ManagementLayer,
    @inject(SecurityService) private readonly securityService: SecurityService,
  ) {
    this.framework = delegate.framework;

    this.listContentSchemasPort = this.securityService.authorizingPort(
      delegate.listContentSchemasPort,
      'schemas:list',
    );

    this.getContentSchemaPort = this.securityService.authorizingPort(
      delegate.getContentSchemaPort,
      'schemas:read',
    );

    this.getStoreContentSchemaPort = this.securityService.authorizingPort(
      delegate.getStoreContentSchemaPort,
      'schemas:read',
    );

    this.listDocumentsPort = this.securityService.authorizingPort(
      delegate.listDocumentsPort,
      'documents:list',
    );
    this.listFromTreePath = this.securityService.authorizingPort(
      delegate.listFromTreePath,
      'documents:list',
    );
    this.getDocumentPort = this.securityService.authorizingPort(
      delegate.getDocumentPort,
      'documents:read',
    );

    this.startTransactionPort = this.securityService.authorizingPort(
      delegate.startTransactionPort,
      'documents:write',
    );
    this.completeTransactionPort = this.securityService.authorizingPort(
      delegate.completeTransactionPort,
      'documents:write',
    );
    this.abortTransactionPort = this.securityService.authorizingPort(
      delegate.abortTransactionPort,
      'documents:write',
    );

    this.putDocumentPort = this.securityService.authorizingPort(
      delegate.putDocumentPort,
      'documents:write',
    );
    this.deleteDocumentPort = this.securityService.authorizingPort(
      delegate.deleteDocumentPort,
      'documents:delete',
    );
    this.publishDocumentPort = this.securityService.authorizingPort(
      delegate.publishDocumentPort,
      'documents:publish',
    );

    this.uploadMediaPort = this.securityService.authorizingPort(
      delegate.uploadMediaPort,
      'documents:write',
    );
    this.mediaThumbnailPort = delegate.mediaThumbnailPort;
    this.deleteMediaPort = this.securityService.authorizingPort(
      delegate.deleteMediaPort,
      'documents:delete',
    );
  }

  public afterPortsBound(): Outcome<void, unknown> {
    return this.delegate.afterPortsBound();
  }
}
