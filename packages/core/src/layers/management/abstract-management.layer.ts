import { AnyParams, Option } from '../../common';
import { createPort, OuterError } from '../../kernel';
import {
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
import { ManagementLayer } from './management.layer';

export abstract class AbstractManagementLayer<Config extends AnyParams | undefined = undefined>
  implements ManagementLayer<Config>
{
  public abstract readonly framework: string;

  public readonly getContentSchemaPort =
    createPort<(store: string) => Option<HydratedContentSchema>>();
  public readonly validateContentPort = createPort<
    (store: string, content: DocumentContent) => ContentValidationResult,
    UnknownContentTypeError
  >();

  public readonly listDocumentsPort = createPort<
    (store: string) => DocumentInfo[],
    UnknownContentTypeError | OuterError
  >();
  public readonly getDocumentPort = createPort<
    (store: string, path: string[], docId?: string, variant?: string) => Option<Document>,
    UnknownContentTypeError | MissingDocIdError | UnsupportedContentVariant | OuterError
  >();
  public readonly putDocumentPort = createPort<
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
  >();
  public readonly deleteDocumentPort = createPort<
    (store: string, path: string[], docId?: string, variant?: string) => Option<Document>,
    UnknownContentTypeError | MissingDocIdError | UnsupportedContentVariant | OuterError
  >();
  public readonly renderDocumentPort = createPort<
    (store: string, path: string[], docId?: string, variant?: string) => void,
    | UnknownContentTypeError
    | MissingDocIdError
    | UnsupportedContentVariant
    | MissingDocumentError
    | OuterError
  >();

  public abstract afterPortsBound(): Promise<void>;
}
