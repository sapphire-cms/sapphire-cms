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
  getDocumentPort: Port<
    (docRef: DocumentReference, credential?: Credential) => Option<Document>,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | OuterError
    | AuthorizationError
  >;
  // TODO: validate document reference
  putDocumentPort: Port<
    (docRef: DocumentReference, content: DocumentContent, credential?: Credential) => Document,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | InvalidDocumentError
    | OuterError
    | AuthorizationError
  >;
  deleteDocumentPort: Port<
    (docRef: DocumentReference, credential?: Credential) => Option<Document>,
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
}
