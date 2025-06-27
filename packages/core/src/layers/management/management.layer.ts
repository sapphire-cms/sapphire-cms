import { AnyParams, Option } from '../../common';
import { AfterPortsBoundAware, Layer, OuterError, Port } from '../../kernel';
import { HttpLayer } from '../../kernel/http-layer';
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
  getHydratedContentSchemasPort: Port<() => HydratedContentSchema[]>;
  getContentSchemasPort: Port<() => ContentSchema[]>; // returns normal content schemas without methods. Useful for HTTP API
  getHydratedContentSchemaPort: Port<(store: string) => Option<HydratedContentSchema>>;
  getContentSchemaPort: Port<(store: string) => Option<ContentSchema>>; // returns normal content schema without methods. Useful for HTTP API

  listDocumentsPort: Port<(store: string) => DocumentInfo[], UnknownContentTypeError | OuterError>;
  getDocumentPort: Port<
    (docRef: DocumentReference) => Option<Document>,
    UnknownContentTypeError | MissingDocIdError | UnsupportedContentVariant | OuterError
  >;
  // TODO: validate document reference
  putDocumentPort: Port<
    (docRef: DocumentReference, content: DocumentContent) => Document,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | InvalidDocumentError
    | OuterError
  >;
  deleteDocumentPort: Port<
    (docRef: DocumentReference) => Option<Document>,
    UnknownContentTypeError | MissingDocIdError | UnsupportedContentVariant | OuterError
  >;
  publishDocumentPort: Port<
    (docRef: DocumentReference) => void,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | MissingDocumentError
    | OuterError
  >;
}
