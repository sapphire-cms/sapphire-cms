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

  @Get('/stores')
  public listStores(@Context() ctx: Context): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.getContentSchemasPort().match(
      (schemas) => {
        res.status(200).body(schemas);
      },
      (err) => {
        console.error(err);
        res.status(500).body(String(err));
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/stores/:store')
  public getStoreConfig(
    @Context() ctx: Context,
    @PathParams('store') store: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    return this.getContentSchemaPort(store).match(
      (optionalSchema) => {
        if (Option.isSome(optionalSchema)) {
          res.status(200).body(optionalSchema.value);
        } else {
          res.status(404).body(`Schema for the store ${store} was not found.`);
        }
      },
      (err) => {
        console.error(err);
        res.status(500).body(String(err));
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/stores/:store/docs')
  public getDocument(
    @Context() ctx: Context,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    path = typeof path === 'string' ? [path] : path;
    const docRef = new DocumentReference(store, path, docId, variant);

    return this.getDocumentPort(docRef).match(
      (optionalDoc) => {
        if (Option.isSome(optionalDoc)) {
          res.status(200).body(optionalDoc.value);
        } else {
          res.status(404).body(`Document ${docRef.toString()} not found.`);
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
            console.error(internalError);
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Put('/stores/:store/docs')
  public putDocument(
    @Context() ctx: Context,
    @BodyParams() content: DocumentContent,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    path = typeof path === 'string' ? [path] : path;
    const docRef = new DocumentReference(store, path, docId, variant);

    return this.putDocumentPort(docRef, content).match(
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
            res.status(400).contentType('application/json').body(JSON.stringify(invalidDocument));
          },
          _: (internalError) => {
            console.error(internalError);
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Delete('/stores/:store/docs')
  public deleteDocument(
    @Context() ctx: Context,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    path = typeof path === 'string' ? [path] : path;
    const docRef = new DocumentReference(store, path, docId, variant);

    return this.deleteDocumentPort(docRef).match(
      (optionalDoc) => {
        if (Option.isSome(optionalDoc)) {
          res.status(200).body(optionalDoc.value);
        } else {
          res.status(404).body(`Document ${docRef.toString()} not found.`);
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
            console.error(internalError);
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/stores/:store/list')
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
            console.error(internalError);
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/stores/:store/actions/publish')
  public publishDocument(
    @Context() ctx: Context,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    path = typeof path === 'string' ? [path] : path;
    const docRef = new DocumentReference(store, path, docId, variant);

    return this.publishDocumentPort(docRef).match(
      () => {
        res.status(204);
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
            console.error(internalError);
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }
}
