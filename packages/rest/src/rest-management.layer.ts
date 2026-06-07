import {
  AbstractManagementLayer,
  DocumentContent,
  DocumentReference,
  Framework,
  matchError,
  MediaAsset,
  MediaType,
  Option,
} from '@sapphire-cms/core';
import {
  BodyParams,
  Context,
  Controller,
  Delete,
  Get,
  PathParams,
  PlatformContext,
  PlatformResponse,
  Post,
  Put,
  QueryParams,
} from '@sapphire-cms/tsed';
import { MultipartFile, PlatformMulterFile } from '@tsed/platform-multer';
import { Outcome, success } from 'defectless';
import { extractCredential } from './authorization-utils';

type MediaMetadata = {
  mimeType: string;
  title?: string;
  alt?: string;
  caption?: string;
};

@Controller('/management')
export class RestManagementLayer extends AbstractManagementLayer {
  private static INSTANCE: RestManagementLayer | undefined;

  public readonly framework = Framework.TSED;

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
  public listStores(@Context() ctx: PlatformContext): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.getContentSchemasPort(credential).match(
      (schemas) => {
        res.status(200).body(schemas);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          _: (otherError) => {
            console.error(otherError);
            res.status(500).body(String(otherError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/stores/:store')
  public getStoreConfig(
    @Context() ctx: PlatformContext,
    @PathParams('store') store: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.getContentSchemaPort(store, credential).match(
      (optionalSchema) => {
        if (Option.isSome(optionalSchema)) {
          res.status(200).body(optionalSchema.value);
        } else {
          res.status(404).body(`Schema for the store ${store} was not found.`);
        }
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          _: (otherError) => {
            console.error(otherError);
            res.status(500).body(String(otherError));
          },
        });
      },
      (defect) => {
        console.error(defect);
        res.status(500).body(String(defect));
      },
    );
  }

  @Get('/stores/:store/docs')
  public getDocument(
    @Context() ctx: PlatformContext,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    path = typeof path === 'string' ? [path] : path;
    const docRef = new DocumentReference(store, path, docId, variant);

    return this.getDocumentPort(docRef, credential).match(
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
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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
    @Context() ctx: PlatformContext,
    @BodyParams() content: DocumentContent,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId?: string,
    @QueryParams('v') variant?: string,
    @QueryParams('t') transactionId?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    path = typeof path === 'string' ? [path] : path;
    const docRef = new DocumentReference(store, path, docId, variant);

    return this.putDocumentPort(docRef, content, transactionId, credential).match(
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
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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
    @Context() ctx: PlatformContext,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId?: string,
    @QueryParams('v') variant?: string,
    @QueryParams('t') transactionId?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    path = typeof path === 'string' ? [path] : path;
    const docRef = new DocumentReference(store, path, docId, variant);

    return this.deleteDocumentPort(docRef, transactionId, credential).match(
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
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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
  public listDocuments(
    @Context() ctx: PlatformContext,
    @PathParams('store') store: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.listDocumentsPort(store, credential).match(
      (docs) => {
        res.status(200).body(docs);
      },
      (err) => {
        matchError(err, {
          UnknownContentTypeError: (unknownContentType) => {
            res.status(404).body(String(unknownContentType));
          },
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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
    @Context() ctx: PlatformContext,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId?: string,
    @QueryParams('v') variant?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    path = typeof path === 'string' ? [path] : path;
    const docRef = new DocumentReference(store, path, docId, variant);

    return this.publishDocumentPort(docRef, credential).match(
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
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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

  @Post('/persistence/transaction')
  public startTransaction(@Context() ctx: PlatformContext): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.startTransactionPort(credential).match(
      (transactionId) => {
        res.status(201).body({
          transactionId,
        });
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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

  @Delete('/persistence/transaction/:transactionId')
  public abortTransaction(
    @Context() ctx: PlatformContext,
    @PathParams('transactionId') transactionId: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.abortTransactionPort(transactionId, credential).match(
      () => {
        res.status(204);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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

  @Post('/persistence/transaction/:transactionId/complete')
  public completeTransaction(
    @Context() ctx: PlatformContext,
    @PathParams('transactionId') transactionId: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    return this.completeTransactionPort(transactionId, credential).match(
      () => {
        res.status(204);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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

  @Get('/media')
  public listMedia(
    @Context() ctx: PlatformContext,
    @QueryParams('p') path: string | string[] = [],
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    path = typeof path === 'string' ? [path] : path;

    return this.listFromTreePath('cms-media', path, credential).match(
      (result) => {
        res.status(200).body(result);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          UnknownContentTypeError: (unknownContentType) => {
            res.status(404).body(String(unknownContentType));
          },
          UnsupportedContentTypeError: (unsupportedContentType) => {
            res.status(409).body(String(unsupportedContentType));
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

  @Delete('/media')
  public deleteMedia(
    @Context() ctx: PlatformContext,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('i') mediaId: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    path = typeof path === 'string' ? [path] : path;

    return this.deleteMediaPort(path, mediaId, credential).match(
      (mediaDocOption) => {
        if (Option.isSome(mediaDocOption)) {
          res.status(204);
        } else {
          res.status(404);
        }
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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

  @Get('/media/thumbnail')
  public mediaThumbnail(
    @Context() ctx: PlatformContext,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('i') mediaId: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    path = typeof path === 'string' ? [path] : path;

    return this.mediaThumbnailPort(path, mediaId, credential).match(
      (asset) => {
        if ('url' in asset) {
          res.status(301).setHeader('Location', asset.url);
        } else {
          // TODO: send file content
        }
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
          },
          MissingDocumentError: (missingDocumentError) => {
            res.status(404).body(String(missingDocumentError));
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

  @Post('/media')
  public uploadMedia(
    @Context() ctx: PlatformContext,
    @MultipartFile('meta') metaPart: PlatformMulterFile,
    @MultipartFile('content') contentPart: PlatformMulterFile,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('i') mediaId?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;
    const credential = extractCredential(ctx);

    path = typeof path === 'string' ? [path] : path;

    const slug = [...path, mediaId].join('/');
    const mediaMetadata = JSON.parse(metaPart.buffer.toString('utf-8')) as MediaMetadata;

    let mediaType: MediaType;

    if (mediaMetadata.mimeType.startsWith('image/')) {
      mediaType = MediaType.IMAGE;
    } else if (mediaMetadata.mimeType.startsWith('video/')) {
      mediaType = MediaType.VIDEO;
    } else {
      res.status(415).body(`Unsupported media type ${mediaMetadata.mimeType}`);
      return Promise.resolve();
    }

    const content = new Uint8Array(contentPart.buffer);

    const asset: MediaAsset = {
      type: mediaType,
      slug,
      mimeType: mediaMetadata.mimeType,
      properties: {
        title: mediaMetadata.title,
        alt: mediaMetadata.alt,
        caption: mediaMetadata.caption,
        sizeInBytes: content.byteLength,
      },
      metadata: {},
      content,
    };

    return this.uploadMediaPort(asset, credential).match(
      () => {
        res.status(201);
      },
      (err) => {
        matchError(err, {
          AuthorizationError: (authorizationError) => {
            res.status(403).body(String(authorizationError));
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
