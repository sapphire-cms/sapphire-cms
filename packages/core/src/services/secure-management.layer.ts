import { Outcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { Option } from '../common';
import { AuthorizationError, Credential, DI_TOKENS, OuterError, Port } from '../kernel';
import { ManagementLayer } from '../layers';
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
} from '../model';
import { SecurityService } from './security.service';

@singleton()
export class SecureManagementLayer implements ManagementLayer {
  public readonly framework: string;
  public readonly getHydratedContentSchemasPort: Port<
    (credential?: Credential) => HydratedContentSchema[],
    AuthorizationError
  >;
  public readonly getContentSchemasPort: Port<
    (credential?: Credential) => ContentSchema[],
    AuthorizationError
  >; // returns normal content schemas without methods. Useful for HTTP API
  public readonly getHydratedContentSchemaPort: Port<
    (store: string, credential?: Credential) => Option<HydratedContentSchema>,
    AuthorizationError
  >;
  public readonly getContentSchemaPort: Port<
    (store: string, credential?: Credential) => Option<ContentSchema>,
    AuthorizationError
  >;

  public readonly listDocumentsPort: Port<
    (store: string, credential?: Credential) => DocumentInfo[],
    UnknownContentTypeError | OuterError | AuthorizationError
  >;
  public readonly getDocumentPort: Port<
    (docRef: DocumentReference, credential?: Credential) => Option<Document>,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | OuterError
    | AuthorizationError
  >;
  public readonly putDocumentPort: Port<
    (docRef: DocumentReference, content: DocumentContent, credential?: Credential) => Document,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | InvalidDocumentError
    | OuterError
    | AuthorizationError
  >;
  public readonly deleteDocumentPort: Port<
    (docRef: DocumentReference, credential?: Credential) => Option<Document>,
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
    | OuterError
    | AuthorizationError
  >;

  constructor(
    @inject(DI_TOKENS.ManagementLayer) private readonly delegate: ManagementLayer,
    @inject(SecurityService) private readonly securityService: SecurityService,
  ) {
    this.framework = delegate.framework;

    this.getHydratedContentSchemasPort = this.securityService.authorizingPort(
      delegate.getHydratedContentSchemasPort,
      'schemas:list',
    );
    this.getContentSchemasPort = this.securityService.authorizingPort(
      delegate.getContentSchemasPort,
      'schemas:list',
    );
    this.getHydratedContentSchemaPort = this.securityService.authorizingPort(
      delegate.getHydratedContentSchemaPort,
      'schemas:read',
    );
    this.getContentSchemaPort = this.securityService.authorizingPort(
      delegate.getContentSchemaPort,
      'schemas:read',
    );
    this.listDocumentsPort = this.securityService.authorizingPort(
      delegate.listDocumentsPort,
      'documents:list',
    );
    this.getDocumentPort = this.securityService.authorizingPort(
      delegate.getDocumentPort,
      'documents:read',
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
  }

  public afterPortsBound(): Outcome<void, unknown> {
    return this.delegate.afterPortsBound();
  }
}
