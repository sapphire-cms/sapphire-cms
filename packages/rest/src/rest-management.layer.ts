import {
  AbstractManagementLayer,
  docRefValidator,
  DocumentContent,
  DocumentReference,
  Frameworks,
  InvalidDocumentReferenceError,
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
        res.status(500).body(String(err));
      },
      (defect) => {
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
        res.status(500).body(String(err));
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/stores/:store/docs')
  @Get('/stores/:store/docs/*')
  public getDocument(
    @Context() ctx: Context,
    @PathParams('store') store: string,
    @PathParams('*') docRef?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    const refStr = RestManagementLayer.docRef(store, docRef, variant);
    const validationResult = docRefValidator(refStr);

    if (!validationResult.isValid) {
      const invalidDocRef = new InvalidDocumentReferenceError(refStr, validationResult);
      res.status(400).contentType('application/json').body(JSON.stringify(invalidDocRef));
      return Promise.resolve();
    }

    const ref = DocumentReference.parse(refStr);

    return this.getDocumentPort(ref).match(
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

  @Put('/stores/:store/docs')
  @Put('/stores/:store/docs/*')
  public putDocument(
    @Context() ctx: Context,
    @BodyParams() content: DocumentContent,
    @PathParams('store') store: string,
    @PathParams('*') docRef?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    const refStr = RestManagementLayer.docRef(store, docRef, variant);
    const validationResult = docRefValidator(refStr);

    if (!validationResult.isValid) {
      const invalidDocRef = new InvalidDocumentReferenceError(refStr, validationResult);
      res.status(400).contentType('application/json').body(JSON.stringify(invalidDocRef));
      return Promise.resolve();
    }

    const ref = DocumentReference.parse(refStr);

    return this.putDocumentPort(ref, content).match(
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
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Delete('/stores/:store/docs')
  @Delete('/stores/:store/docs/*')
  public deleteDocument(
    @Context() ctx: Context,
    @PathParams('store') store: string,
    @PathParams('*') docRef?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    const refStr = RestManagementLayer.docRef(store, docRef, variant);
    const validationResult = docRefValidator(refStr);

    if (!validationResult.isValid) {
      const invalidDocRef = new InvalidDocumentReferenceError(refStr, validationResult);
      res.status(400).contentType('application/json').body(JSON.stringify(invalidDocRef));
      return Promise.resolve();
    }

    const ref = DocumentReference.parse(refStr);

    return this.deleteDocumentPort(ref).match(
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
            res.status(500).body(String(internalError));
          },
        });
      },
      (defect) => {
        res.status(500).body(String(defect));
      },
    );
  }

  @Post('/stores/:store/actions/publish/*')
  public publishDocument(
    @Context() ctx: Context,
    @PathParams('store') store: string,
    @PathParams('*') docRef: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    const refStr = RestManagementLayer.docRef(store, docRef, variant);
    const validationResult = docRefValidator(refStr);

    if (!validationResult.isValid) {
      const invalidDocRef = new InvalidDocumentReferenceError(refStr, validationResult);
      res.status(400).contentType('application/json').body(JSON.stringify(invalidDocRef));
      return Promise.resolve();
    }

    const ref = DocumentReference.parse(refStr);

    return this.publishDocumentPort(ref).match(
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

  private static docRef(store: string, docRef?: string, variant?: string): string {
    let refStr = store;

    if (docRef) {
      refStr += '/' + docRef;
    }

    if (variant) {
      refStr += ':' + variant;
    }

    return refStr;
  }
}
