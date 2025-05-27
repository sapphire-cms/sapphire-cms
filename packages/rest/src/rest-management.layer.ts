import {
  AbstractManagementLayer,
  DocumentContent,
  DocumentReference,
  Frameworks,
  matchError,
  Option,
} from '@sapphire-cms/core';
import { BodyParams, Context, Delete, Get, PathParams, Post, Put, QueryParams } from '@tsed/common';
import { Controller } from '@tsed/di';
import { PlatformResponse } from '@tsed/platform-http';
import { Outcome, success } from 'defectless';

@Controller('/management')
export class RestManagementLayer extends AbstractManagementLayer {
  private static INSTANCE: RestManagementLayer | undefined;

  public readonly framework = Frameworks.TSED;

  constructor() {
    if (RestManagementLayer.INSTANCE) {
      return RestManagementLayer.INSTANCE;
    }

    super();

    RestManagementLayer.INSTANCE = this;
  }

  public afterPortsBound(): Outcome<void, never> {
    return success();
  }

  @Get('/stores/:store')
  public listDocuments(@Context() ctx: Context, @PathParams('store') store: string): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.listDocumentsPort(store).match(
      (docs) => {
        res.status(200).body(docs);
      },
      (err) => {
        matchError(err, {
          UnknownContentTypeError: (unknownContentType) => {
            res.status(404).body(String(unknownContentType));
          },
          _: (internalError) => {
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/docs/*')
  public getDocument(
    @Context() ctx: Context,
    @PathParams('*') docRef: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const refStr = docRef + (variant ? `:${variant}` : '');
    const ref = DocumentReference.parse(refStr);

    return this.getDocumentPort(ref.store, ref.path, ref.docId, ref.variant).match(
      (optionalDoc) => {
        if (Option.isSome(optionalDoc)) {
          res.status(200).body(optionalDoc.value);
        } else {
          res.status(404).body(`Document ${ref.toString()} not found.`);
        }
      },
      (err) => {
        matchError(err, {
          UnknownContentTypeError: (unknownContentType) => {
            res.status(404).body(String(unknownContentType));
          },
          MissingDocIdError: (missingDocId) => {
            res.status(404).body(String(missingDocId));
          },
          UnsupportedContentVariant: (unsupportedVariant) => {
            res.status(406).body(String(unsupportedVariant));
          },
          _: (internalError) => {
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Put('/docs/*')
  public putDocument(
    @Context() ctx: Context,
    @PathParams('*') docRef: string,
    @BodyParams() content: DocumentContent,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const refStr = docRef + (variant ? `:${variant}` : '');
    const ref = DocumentReference.parse(refStr);

    return this.putDocumentPort(ref.store, ref.path, content, ref.docId, ref.variant).match(
      (doc) => {
        res.status(200).body(doc);
      },
      (err) => {
        matchError(err, {
          UnknownContentTypeError: (unknownContentType) => {
            res.status(404).body(String(unknownContentType));
          },
          MissingDocIdError: (missingDocId) => {
            res.status(404).body(String(missingDocId));
          },
          UnsupportedContentVariant: (unsupportedVariant) => {
            res.status(406).body(String(unsupportedVariant));
          },
          InvalidDocumentError: (invalidDocument) => {
            res.status(400).body(String(invalidDocument));
          },
          _: (internalError) => {
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Delete('/docs/*')
  public deleteDocument(
    @Context() ctx: Context,
    @PathParams('*') docRef: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const refStr = docRef + (variant ? `:${variant}` : '');
    const ref = DocumentReference.parse(refStr);

    return this.deleteDocumentPort(ref.store, ref.path, ref.docId, ref.variant).match(
      (optionalDoc) => {
        if (Option.isSome(optionalDoc)) {
          res.status(200).body(optionalDoc.value);
        } else {
          res.status(404).body(`Document ${ref.toString()} not found.`);
        }
      },
      (err) => {
        matchError(err, {
          UnknownContentTypeError: (unknownContentType) => {
            res.status(404).body(String(unknownContentType));
          },
          MissingDocIdError: (missingDocId) => {
            res.status(404).body(String(missingDocId));
          },
          UnsupportedContentVariant: (unsupportedVariant) => {
            res.status(406).body(String(unsupportedVariant));
          },
          _: (internalError) => {
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/actions/render/*')
  public renderDocument(
    @Context() ctx: Context,
    @PathParams('*') docRef: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const refStr = docRef + (variant ? `:${variant}` : '');
    const ref = DocumentReference.parse(refStr);

    return this.deleteDocumentPort(ref.store, ref.path, ref.docId, ref.variant).match(
      () => {
        res.status(200);
      },
      (err) => {
        matchError(err, {
          UnknownContentTypeError: (unknownContentType) => {
            res.status(404).body(String(unknownContentType));
          },
          MissingDocIdError: (missingDocId) => {
            res.status(404).body(String(missingDocId));
          },
          UnsupportedContentVariant: (unsupportedVariant) => {
            res.status(406).body(String(unsupportedVariant));
          },
          MissingDocumentError: (missingDoc) => {
            res.status(404).body(String(missingDoc));
          },
          _: (internalError) => {
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }
}
