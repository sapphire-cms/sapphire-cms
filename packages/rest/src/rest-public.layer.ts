import {
  AbstractPublicLayer,
  ContentFilter,
  ContentSort,
  Framework,
  matchError,
  Option,
} from '@sapphire-cms/core';
import { Context, Get, HeaderParams, QueryParams } from '@tsed/common';
import { Controller } from '@tsed/di';
import { PlatformContext, PlatformResponse } from '@tsed/platform-http';
import { PathParams } from '@tsed/platform-params';
import { Outcome, success } from 'defectless';

export const _toContentFilter = Symbol('_toContentFilter');
export const _toContentSort = Symbol('_toContentSort');

@Controller('/public')
export class RestPublicLayer extends AbstractPublicLayer {
  private static INSTANCE: RestPublicLayer | undefined;

  public readonly framework = Framework.TSED;

  constructor() {
    if (RestPublicLayer.INSTANCE) {
      return RestPublicLayer.INSTANCE;
    }

    super();

    RestPublicLayer.INSTANCE = this;
  }

  public afterPortsBound(): Outcome<void, never> {
    return success();
  }

  @Get('/content/:store')
  public getContent(
    @Context() ctx: PlatformContext,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('d') docId: string,
    @QueryParams('v') variant: string = 'default',
    @HeaderParams('accept') mediaType: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    path = typeof path === 'string' ? [path] : path;

    return this.getContentPort(store, path, docId, variant, mediaType).match(
      (contentOption) => {
        if (Option.isNone(contentOption)) {
          res.status(404);
          return;
        }

        const content = contentOption.value;

        if (content instanceof Uint8Array) {
          res.status(200).contentType(mediaType).body(Buffer.from(content));
        } else if (typeof content === 'string') {
          res.status(200).contentType(mediaType).body(content);
        } else if (
          typeof content === 'object' &&
          content !== null &&
          'url' in content &&
          typeof content.url === 'string'
        ) {
          res.status(307).setHeader('Location', content.url);
        } else {
          res.status(200).contentType(mediaType).body(content);
        }
      },
      (err) => {
        matchError(err, {
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

  @Get('/list/:store')
  public listContent(
    @Context() ctx: PlatformContext,
    @PathParams('store') store: string,
    @QueryParams('p') path: string | string[] = [],
    @QueryParams('mediaType') mediaType: string,
    @QueryParams('v') variants: string | string[] = ['default'],
    @QueryParams('page') page: number = 0,
    @QueryParams('size') size: number = 10,
    @QueryParams('f') filter: Record<string, string> = {},
    @QueryParams('s') sort?: string,
  ): Promise<void> {
    const res: PlatformResponse = ctx.response;

    path = typeof path === 'string' ? [path] : path;
    variants = typeof variants === 'string' ? [variants] : variants;

    const contentFilter: ContentFilter = RestPublicLayer[_toContentFilter](filter);
    const contentSort: ContentSort = sort ? RestPublicLayer[_toContentSort](sort) : [];

    return this.listContentPort(
      store,
      path,
      mediaType,
      variants,
      { page, size },
      contentFilter,
      contentSort,
    ).match(
      (page) => {
        res.status(200).body(page);
      },
      (err) => {
        matchError(err, {
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

  private static [_toContentFilter](filter: Record<string, string>): ContentFilter {
    return Object.fromEntries(
      Object.entries(filter).map(([field, value]) => {
        if (value === 'true') {
          return [field, true];
        }

        if (value === 'false') {
          return [field, false];
        }

        const number = Number(value);

        if (value.trim() !== '' && !Number.isNaN(number)) {
          return [field, number];
        }

        return [field, value];
      }),
    );
  }

  private static [_toContentSort](sort: string): ContentSort {
    return sort.split(',').map((field) => ({
      field: field.startsWith('-') ? field.slice(1) : field,
      sort: field.startsWith('-') ? 'desc' : 'asc',
    }));
  }
}
