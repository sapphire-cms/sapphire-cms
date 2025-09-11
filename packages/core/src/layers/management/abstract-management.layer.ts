import { Outcome } from 'defectless';
import { AnyParams, Option } from '../../common';
import { AuthorizationError, createPort, OuterError, Credential } from '../../kernel';
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
import { ManagementLayer } from './management.layer';

export abstract class AbstractManagementLayer<Config extends AnyParams | undefined = undefined>
  implements ManagementLayer<Config>
{
  public abstract readonly framework: string;

  public readonly getHydratedContentSchemasPort = createPort<
    (credential?: Credential) => HydratedContentSchema[],
    AuthorizationError
  >();

  public readonly getContentSchemasPort = createPort<
    (credential?: Credential) => ContentSchema[],
    AuthorizationError
  >();

  public readonly getHydratedContentSchemaPort = createPort<
    (store: string, credential?: Credential) => Option<HydratedContentSchema>,
    AuthorizationError
  >();

  public readonly getContentSchemaPort = createPort<
    (store: string, credential?: Credential) => Option<ContentSchema>,
    AuthorizationError
  >();

  public readonly listDocumentsPort = createPort<
    (store: string, credential?: Credential) => DocumentInfo[],
    UnknownContentTypeError | OuterError | AuthorizationError
  >();

  public readonly getDocumentPort = createPort<
    (docRef: DocumentReference, credential?: Credential) => Option<Document>,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | OuterError
    | AuthorizationError
  >();

  public readonly putDocumentPort = createPort<
    (docRef: DocumentReference, content: DocumentContent, credential?: Credential) => Document,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | InvalidDocumentError
    | OuterError
    | AuthorizationError
  >();

  public readonly deleteDocumentPort = createPort<
    (docRef: DocumentReference, credential?: Credential) => Option<Document>,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | OuterError
    | AuthorizationError
  >();

  public readonly publishDocumentPort = createPort<
    (docRef: DocumentReference, credential?: Credential) => void,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | MissingDocumentError
    | OuterError
    | AuthorizationError
  >();

  public abstract afterPortsBound(): Outcome<void, never>;
}
