import * as process from 'node:process';
import {
  AbstractManagementLayer,
  ContentType,
  ContentValidationResult,
  docRefValidator,
  Document,
  DocumentAlreadyExistError,
  DocumentContent,
  DocumentReference,
  Frameworks,
  HydratedContentSchema,
  HydratedFieldSchema,
  InvalidDocumentError,
  InvalidDocumentReferenceError,
  makeHiddenCollectionName,
  matchError,
  MissingDocIdError,
  MissingDocumentError,
  Option,
  OuterError,
  PortError,
  UnknownContentTypeError,
  UnsupportedContentVariant,
} from '@sapphire-cms/core';
import { FsError } from '@sapphire-cms/node';
import chalk from 'chalk';
import { failure, Outcome, Program, program, success } from 'defectless';
import { Cmd, optsFromArray, ProcessError, TextFormParseError } from '../common';
import { CliModuleParams } from './cli.module';
import { TextFormService } from './services/textform.service';

const IN_DOC_COMMAND_PATTERN = /cmd:new(?:\s+([^\s]+))?/;

export class CliManagementLayer extends AbstractManagementLayer<CliModuleParams> {
  public readonly framework = Frameworks.NONE;

  constructor(
    private readonly params: { cmd: string; args: string[]; opts: string[]; editor: string | null },
  ) {
    super();
  }

  public afterPortsBound(): Outcome<void, never> {
    if (this.params.cmd.startsWith('schema:')) {
      return this.handleSchemaCommand();
    } else if (this.params.cmd.startsWith('document')) {
      return this.handleDocumentCommand();
    } else {
      return success();
    }
  }

  private handleSchemaCommand(): Outcome<void, never> {
    switch (this.params.cmd) {
      case Cmd.list_schemas:
        return Outcome.fromSupplier(() =>
          this.listSchemas().match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      default:
        console.error(`Unknown command: "${this.params.cmd}"`);
        return success();
    }
  }

  private handleDocumentCommand(): Outcome<void, never> {
    const store = this.params.args[0];

    const opts = optsFromArray(this.params.opts);
    const path: string[] = opts.get('path') ? (opts.get('path') as string).split('/') : [];
    const docId = opts.get('doc');
    const variant = opts.get('variant');

    const editor = opts.get('editor') || this.params.editor || process.env.EDITOR!;

    const docRef = new DocumentReference(store, path, docId, variant);

    switch (this.params.cmd) {
      case Cmd.document_list:
        return Outcome.fromSupplier(() =>
          this.listDocuments(store).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.document_print:
        return Outcome.fromSupplier(() =>
          this.printDocument(docRef).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.document_create:
        return Outcome.fromSupplier(() =>
          this.createDocument(docRef, editor).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.document_edit:
        return Outcome.fromSupplier(() =>
          this.editDocument(docRef, editor).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.document_ref_edit: {
        const str = this.params.args[0];
        const validationResult = docRefValidator(str);

        if (!validationResult.isValid) {
          const error = new InvalidDocumentReferenceError(str, validationResult);
          console.error(error);
          return success();
        }

        const docRef = DocumentReference.parse(str);
        return Outcome.fromSupplier(() =>
          this.editDocument(docRef, editor).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      }
      case Cmd.document_delete:
        return Outcome.fromSupplier(() =>
          this.deleteDocument(docRef).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.document_publish:
        return Outcome.fromSupplier(() =>
          this.publishDocument(docRef).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      default:
        console.error(`Unknown command: "${this.params.cmd}"`);
        return success();
    }
  }

  private listSchemas(): Outcome<void, PortError> {
    return this.getHydratedContentSchemasPort().map((allSchemas) => {
      for (const schema of allSchemas) {
        console.log(
          `${chalk.blue(schema.name)} (${schema.type})   ${chalk.grey(schema.description)}`,
        );
      }
    });
  }

  private listDocuments(
    store: string,
  ): Outcome<void, UnknownContentTypeError | OuterError | PortError> {
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
    docRef: DocumentReference,
  ): Outcome<
    void,
    UnknownContentTypeError | UnsupportedContentVariant | MissingDocIdError | OuterError | PortError
  > {
    return this.getDocumentPort(docRef).map((optionalDoc) => {
      if (Option.isNone(optionalDoc)) {
        console.error(chalk.red(`Document ${docRef.toString()} doesn't exist`));
        return;
      }

      console.dir(optionalDoc.value, { depth: null });
    });
  }

  private createDocument(
    docRef: DocumentReference,
    editor: string,
  ): Outcome<
    Document,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | DocumentAlreadyExistError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
  > {
    return program(function* (): Program<
      Document,
      | UnknownContentTypeError
      | UnsupportedContentVariant
      | MissingDocIdError
      | DocumentAlreadyExistError
      | ProcessError
      | OuterError
      | PortError
      | FsError
      | TextFormParseError
    > {
      const optionalContentSchema: Option<HydratedContentSchema> =
        yield this.getHydratedContentSchemaPort(docRef.store);
      if (Option.isNone(optionalContentSchema)) {
        return failure(new UnknownContentTypeError(docRef.store));
      }

      const contentSchema = optionalContentSchema.value;

      if (docRef.docId || contentSchema.type === ContentType.SINGLETON) {
        const optionalDoc: Option<Document> = yield this.getDocumentPort(docRef);

        if (Option.isSome(optionalDoc)) {
          return failure(new DocumentAlreadyExistError(docRef));
        }
      }

      return this.loopInput(docRef, contentSchema, editor);
    }, this);
  }

  private editDocument(
    docRef: DocumentReference,
    editor: string,
  ): Outcome<
    Document,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | MissingDocumentError
    | DocumentAlreadyExistError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
  > {
    return program(function* (): Program<
      Document,
      | UnknownContentTypeError
      | UnsupportedContentVariant
      | MissingDocIdError
      | MissingDocumentError
      | DocumentAlreadyExistError
      | ProcessError
      | OuterError
      | PortError
      | FsError
      | TextFormParseError
    > {
      const optionalContentSchema = yield this.getHydratedContentSchemaPort(docRef.store);
      if (Option.isNone(optionalContentSchema)) {
        return failure(new UnknownContentTypeError(docRef.store));
      }

      const contentSchema = optionalContentSchema.value;

      const optionalDoc: Option<Document> = yield this.getDocumentPort(docRef);
      if (Option.isNone(optionalDoc)) {
        return failure(new MissingDocumentError(docRef));
      }
      const doc = optionalDoc.value;
      return this.loopInput(docRef, contentSchema, editor, doc.content);
    }, this);
  }

  private loopInput(
    docRef: DocumentReference,
    contentSchema: HydratedContentSchema,
    editor: string,
    content?: DocumentContent,
    validation?: ContentValidationResult,
  ): Outcome<
    Document,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | DocumentAlreadyExistError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
  > {
    return this.inputContent(editor, contentSchema, docRef.variant, content, validation).flatMap(
      (content) =>
        this.putDocumentPort(docRef, content).recover((err) =>
          matchError(err, {
            InvalidDocumentError: (invalidDoc) => {
              return this.loopInput(
                docRef,
                contentSchema,
                editor,
                content,
                (invalidDoc as InvalidDocumentError).validationResult,
              );
            },
            _: (err) => {
              return failure(
                err as
                  | UnknownContentTypeError
                  | UnsupportedContentVariant
                  | MissingDocIdError
                  | DocumentAlreadyExistError
                  | ProcessError
                  | OuterError
                  | PortError
                  | FsError
                  | TextFormParseError,
              );
            },
          }),
        ),
    );
  }

  private inputContent(
    editor: string,
    contentSchema: HydratedContentSchema,
    variant?: string,
    existingContent?: DocumentContent,
    validation?: ContentValidationResult,
  ): Outcome<
    DocumentContent,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | DocumentAlreadyExistError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
  > {
    const textformService = new TextFormService(contentSchema, editor);

    return program(function* (): Program<
      DocumentContent,
      | UnknownContentTypeError
      | UnsupportedContentVariant
      | MissingDocIdError
      | DocumentAlreadyExistError
      | ProcessError
      | OuterError
      | PortError
      | FsError
      | TextFormParseError
    > {
      const input = yield textformService.getDocumentContent(existingContent, validation);
      const content: DocumentContent = {};

      // Process group fields
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

      return content;
    }, this);
  }

  private processGroupRef(
    groupRef: string,
    contentSchema: HydratedContentSchema,
    fieldSchema: HydratedFieldSchema,
    editor: string,
    variant?: string,
  ): Outcome<
    DocumentReference,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | DocumentAlreadyExistError
    | ProcessError
    | OuterError
    | PortError
    | FsError
    | TextFormParseError
  > {
    return program(function* (): Program<
      DocumentReference,
      | UnknownContentTypeError
      | UnsupportedContentVariant
      | MissingDocIdError
      | DocumentAlreadyExistError
      | OuterError
      | PortError
      | FsError
      | TextFormParseError
    > {
      const match = groupRef.match(IN_DOC_COMMAND_PATTERN);
      if (!match) {
        return DocumentReference.parse(groupRef);
      }

      const groupFieldId = match[1];

      // Create group document in the hidden collection
      const hiddenCollection = makeHiddenCollectionName(contentSchema.name, fieldSchema.name);
      const groupDocRef = new DocumentReference(hiddenCollection, [], groupFieldId, variant);
      const groupDoc: Document = yield this.createDocument(groupDocRef, editor);
      return new DocumentReference(groupDoc.store, [], groupDoc.id, groupDoc.variant);
    }, this);
  }

  private deleteDocument(
    docRef: DocumentReference,
  ): Outcome<
    void,
    UnknownContentTypeError | UnsupportedContentVariant | MissingDocIdError | OuterError | PortError
  > {
    return this.deleteDocumentPort(docRef).map(() => {});
  }

  private publishDocument(
    docRef: DocumentReference,
  ): Outcome<
    void,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | MissingDocumentError
    | OuterError
    | PortError
  > {
    return this.publishDocumentPort(docRef);
  }
}
