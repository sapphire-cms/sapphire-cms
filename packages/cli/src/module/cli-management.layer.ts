import * as process from 'node:process';
import {
  AbstractManagementLayer,
  ContentValidationResult,
  Document,
  DocumentContent,
  DocumentReference,
  HydratedContentSchema,
  makeHiddenCollectionName,
  MissingDocIdError,
  OuterError,
  PortError,
  UnknownContentTypeError,
  Option,
  CombinedError,
  asyncProgram,
  AsyncProgram,
  DocumentAlreadyExistError,
  MissingDocumentError,
  UnsupportedContentVariant,
  InvalidDocumentError,
  HydratedFieldSchema,
} from '@sapphire-cms/core';
import { FsError } from '@sapphire-cms/node';
import chalk from 'chalk';
import { errAsync, ResultAsync } from 'neverthrow';
import { Cmd, optsFromArray, ProcessError, TextFormParseError } from '../common';
import { CliModuleParams } from './cli.module';
import { TextFormService } from './services/textform.service';

const IN_DOC_COMMAND_PATTERN = /cmd:new\s+([^\s]+)/;

export class CliManagementLayer extends AbstractManagementLayer<CliModuleParams> {
  constructor(
    private readonly params: { cmd: string; args: string[]; opts: string[]; editor: string | null },
  ) {
    super();
  }

  public async afterPortsBound(): Promise<void> {
    if (!this.params.cmd.startsWith('document')) {
      return Promise.resolve();
    }

    const store = this.params.args[0];

    const opts = optsFromArray(this.params.opts);
    const path: string[] = opts.get('path') ? (opts.get('path') as string).split('/') : [];
    const docId = opts.get('doc');
    const variant = opts.get('variant');

    const editor = opts.get('editor') || this.params.editor || process.env.EDITOR!;

    switch (this.params.cmd) {
      case Cmd.document_list:
        return this.listDocuments(store).match(
          () => {},
          (err) => console.error(err),
        );
      case Cmd.document_print:
        return this.printDocument(store, path, docId, variant).match(
          () => {},
          (err) => console.error(err),
        );
      case Cmd.document_create:
        return this.createDocument(editor, store, path, docId, variant).match(
          () => {},
          (err) => console.error(err),
        );
      case Cmd.document_edit:
        return this.editDocument(editor, store, path, docId, variant).match(
          () => {},
          (err) => console.error(err),
        );
      case Cmd.document_ref_edit: {
        const docRef = DocumentReference.parse(this.params.args[0]);
        return this.editDocument(
          editor,
          docRef.store,
          docRef.path,
          docRef.docId,
          docRef.variant,
        ).then(() => {});
      }
      case Cmd.document_delete:
        return this.deleteDocument(store, path, docId, variant).match(
          () => {},
          (err) => console.error(err),
        );
      case Cmd.document_render:
        return this.renderDocument(store, path, docId, variant).match(
          () => {},
          (err) => console.error(err),
        );
      default:
        console.error(`Unknown command: "${this.params.cmd}"`);
        return Promise.resolve();
    }
  }

  private listDocuments(
    store: string,
  ): ResultAsync<void, UnknownContentTypeError | OuterError | PortError> {
    return this.listDocumentsPort(store).map((docsInfo) => {
      for (const docInfo of docsInfo) {
        let str = chalk.blue(docInfo.store);

        if (docInfo.path.length) {
          str += chalk.yellow('/' + docInfo.path.join('/'));
        }

        if (docInfo.docId) {
          str += chalk.magenta('/' + docInfo.docId);
        }

        str += chalk.grey(' (variants: ' + docInfo.variants.join(', ') + ')');

        console.log(str);
      }
    });
  }

  private printDocument(
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): ResultAsync<
    void,
    UnknownContentTypeError | UnsupportedContentVariant | MissingDocIdError | OuterError | PortError
  > {
    return this.getDocumentPort(store, path, docId, variant).map((optionalDoc) => {
      if (Option.isNone(optionalDoc)) {
        const ref = new DocumentReference(store, path, docId, variant);
        console.error(chalk.red(`Document ${ref.toString()} doesn't exist`));
        return;
      }

      console.dir(optionalDoc.value, { depth: null });
    });
  }

  private createDocument(
    editor: string,
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): ResultAsync<
    Document,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | DocumentAlreadyExistError
    | InvalidDocumentError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
    | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
  > {
    return asyncProgram(
      function* (): AsyncProgram<
        Document,
        | UnknownContentTypeError
        | UnsupportedContentVariant
        | MissingDocIdError
        | DocumentAlreadyExistError
        | InvalidDocumentError
        | ProcessError
        | OuterError
        | PortError
        | FsError
        | TextFormParseError
        | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
      > {
        const optionalContentSchema = yield this.getContentSchemaPort(store);
        if (Option.isNone(optionalContentSchema)) {
          return errAsync(new UnknownContentTypeError(store));
        }

        const contentSchema = optionalContentSchema.value;

        if (docId) {
          const optionalDoc: Option<Document> = yield this.getDocumentPort(
            store,
            path,
            docId,
            variant,
          );
          if (Option.isSome(optionalDoc)) {
            return errAsync(new DocumentAlreadyExistError(store, path, docId, variant));
          }
        }

        const content: DocumentContent = yield this.inputContent(editor, contentSchema, variant);
        return this.putDocumentPort(contentSchema.name, path, content, docId, variant);
      },
      (defect) => errAsync(new FsError('Defective createDocument program', defect)),
      this,
    );
  }

  private editDocument(
    editor: string,
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): ResultAsync<
    Document,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | InvalidDocumentError
    | MissingDocumentError
    | DocumentAlreadyExistError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
    | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
  > {
    return asyncProgram(
      function* (): AsyncProgram<
        Document,
        | UnknownContentTypeError
        | UnsupportedContentVariant
        | MissingDocIdError
        | InvalidDocumentError
        | MissingDocumentError
        | DocumentAlreadyExistError
        | ProcessError
        | OuterError
        | PortError
        | FsError
        | TextFormParseError
        | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
      > {
        const optionalContentSchema = yield this.getContentSchemaPort(store);
        if (Option.isNone(optionalContentSchema)) {
          return errAsync(new UnknownContentTypeError(store));
        }

        const contentSchema = optionalContentSchema.value;

        const optionalDoc: Option<Document> = yield this.getDocumentPort(
          store,
          path,
          docId,
          variant,
        );
        if (Option.isNone(optionalDoc)) {
          return errAsync(new MissingDocumentError(store, path, docId, variant));
        }
        const doc = optionalDoc.value;

        const content = yield this.inputContent(editor, contentSchema, variant, doc.content);
        return this.putDocumentPort(contentSchema.name, path, content, docId, variant);
      },
      (defect) => errAsync(new FsError('Defective createDocument program', defect)),
      this,
    );
  }

  private inputContent(
    editor: string,
    contentSchema: HydratedContentSchema,
    variant?: string,
    existingContent?: DocumentContent,
    validation?: ContentValidationResult<DocumentContent>,
  ): ResultAsync<
    DocumentContent,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | DocumentAlreadyExistError
    | InvalidDocumentError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
    | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
  > {
    const textformService = new TextFormService(contentSchema, editor);

    return asyncProgram(
      function* (): AsyncProgram<
        DocumentContent,
        | UnknownContentTypeError
        | UnsupportedContentVariant
        | MissingDocIdError
        | DocumentAlreadyExistError
        | InvalidDocumentError
        | ProcessError
        | OuterError
        | PortError
        | FsError
        | TextFormParseError
        | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
      > {
        const input = yield textformService.getDocumentContent(existingContent, validation);
        const content: DocumentContent = {};

        // Process group fields
        // TODO: this code opens editor for all groups at same time. Make it to make one input in time
        for (const field of contentSchema.fields) {
          if (field.type.name === 'group') {
            for (let i = 0; i < input[field.name].length; i++) {
              const groupRef: DocumentReference = yield this.processGroupRef(
                input[field.name][i],
                contentSchema,
                field,
                editor,
                variant,
              );
              input[field.name][i] = groupRef.toString();
            }
          }
        }

        for (const field of contentSchema.fields) {
          if (!field.isList) {
            // Remove multiple fields
            content[field.name] = input[field.name].length ? input[field.name][0] : undefined;
          } else {
            content[field.name] = input[field.name];
          }
        }

        const validationResult = yield this.validateContentPort(contentSchema.name, content);
        if (!validationResult.isValid) {
          return this.inputContent(editor, contentSchema, variant, content, validationResult);
        }

        return content;
      },
      (defect) => errAsync(new FsError('Defective inputContent program', defect)),
      this,
    );
  }

  private processGroupRef(
    groupRef: string,
    contentSchema: HydratedContentSchema,
    fieldSchema: HydratedFieldSchema,
    editor: string,
    variant?: string,
  ): ResultAsync<
    DocumentReference,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | DocumentAlreadyExistError
    | InvalidDocumentError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
    | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
  > {
    return asyncProgram(
      function* (): AsyncProgram<
        DocumentReference,
        | UnknownContentTypeError
        | UnsupportedContentVariant
        | MissingDocIdError
        | DocumentAlreadyExistError
        | InvalidDocumentError
        | OuterError
        | PortError
        | FsError
        | TextFormParseError
        | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
      > {
        const match = groupRef.match(IN_DOC_COMMAND_PATTERN);
        if (!match) {
          return DocumentReference.parse(groupRef);
        }

        const groupFieldId = match[1];

        // Create group document in the hidden collection
        const hiddenCollection = makeHiddenCollectionName(contentSchema.name, fieldSchema.name);
        const groupDoc: Document = yield this.createDocument(
          editor,
          hiddenCollection,
          [],
          groupFieldId,
          variant,
        );
        return new DocumentReference(groupDoc.store, [], groupDoc.id, groupDoc.variant);
      },
      (defect) => errAsync(new FsError('Defective processGroupRef program', defect)),
      this,
    );
  }

  private deleteDocument(
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): ResultAsync<
    void,
    UnknownContentTypeError | UnsupportedContentVariant | MissingDocIdError | OuterError | PortError
  > {
    return this.deleteDocumentPort(store, path, docId, variant).map(() => {});
  }

  private renderDocument(
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): ResultAsync<
    void,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | MissingDocumentError
    | OuterError
    | PortError
  > {
    return this.renderDocumentPort(store, path, docId, variant);
  }
}
