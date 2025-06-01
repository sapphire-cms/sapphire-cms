import { AnyParams, Option } from '../../common';
import { AfterPortsBoundAware, Layer, OuterError, Port } from '../../kernel';
import { HttpLayer } from '../../kernel/http-layer';
import {
  ContentSchema,
  ContentValidationResult,
  Document,
  DocumentContent,
  DocumentInfo,
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
  validateContentPort: Port<
    (store: string, content: DocumentContent) => ContentValidationResult,
    UnknownContentTypeError
  >;

  listDocumentsPort: Port<(store: string) => DocumentInfo[], UnknownContentTypeError | OuterError>;
  getDocumentPort: Port<
    (store: string, path: string[], docId?: string, variant?: string) => Option<Document>,
    UnknownContentTypeError | MissingDocIdError | UnsupportedContentVariant | OuterError
  >;
  putDocumentPort: Port<
    (
      store: string,
      path: string[],
      content: DocumentContent,
      docId?: string,
      variant?: string,
    ) => Document,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | InvalidDocumentError
    | OuterError
  >;
  deleteDocumentPort: Port<
    (store: string, path: string[], docId?: string, variant?: string) => Option<Document>,
    UnknownContentTypeError | MissingDocIdError | UnsupportedContentVariant | OuterError
  >;
  publishDocumentPort: Port<
    (store: string, path: string[], docId?: string, variant?: string) => void,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | MissingDocumentError
    | OuterError
  >;
}
