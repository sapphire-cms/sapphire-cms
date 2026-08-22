import {
  ContentDescriptor,
  ContentFilter,
  ContentLocation,
  ContentMap,
  ContentPagination,
  ContentSort,
  DocumentReference,
  PagedResponse,
} from '@sapphire-cms/core';
import {
  ClientContentLocator,
  ExternalMapContentLocator,
  StaticClientContentLocator,
} from './client-content-locator';
import { ContentResolver } from './content-resolver';
import { PublishedContent } from './published-content';

export type SapphireClientOptions = { mediaType: string; cmsUrl?: string } & (
  | { contentMap: ContentMap }
  | { contentMapUrl: string }
  | { cmsUrl: string }
);

export class SapphireClient {
  private readonly locator?: ClientContentLocator;
  private readonly resolver: ContentResolver;

  protected constructor(private readonly options: SapphireClientOptions) {
    if ('contentMap' in options) {
      this.locator = new StaticClientContentLocator(options.contentMap);
    } else if ('contentMapUrl' in options) {
      this.locator = new ExternalMapContentLocator(options.contentMapUrl);
    }

    this.resolver = new ContentResolver(options.cmsUrl);
  }

  public async get(
    store: string,
    path: string[],
    docId: string,
    variant: string = 'default',
    mediaType?: string,
  ): Promise<PublishedContent> {
    if (this.locator) {
      const location = await this.locator.locate(
        store,
        path,
        docId,
        variant,
        mediaType || this.options.mediaType,
      );

      if (!location) {
        const docRef = new DocumentReference(store, path, docId, variant);

        return Promise.reject({
          code: 404,
          reason: `Failed to locate content ${docRef.toString()}`,
        });
      }

      return this.resolver.resolve(location!);
    } else {
      const location: ContentLocation = {
        store,
        path,
        docId,
        variant,
        mediaType: mediaType || this.options.mediaType,
        provider: 'unknown',
        resourcePath: 'unknown',
        index: {},
      };

      return this.resolver.resolve(location);
    }
  }

  public async find(
    store: string,
    path: string[],
    variant: string = 'default',
    pagination: ContentPagination,
    filter: ContentFilter,
    sort: ContentSort,
    mediaType?: string,
  ): Promise<PagedResponse<PublishedContent>> {
    if (this.locator) {
      const locations = await this.locator.list(
        store,
        path,
        {
          variants: [variant],
          mediaTypes: [mediaType || this.options.mediaType],
        },
        pagination,
        filter,
        sort,
      );

      const content = await Promise.all(
        locations.content.map((location) => this.resolver.resolve(location)),
      );

      return {
        content,
        pagination: locations.pagination,
      };
    } else {
      const url = new URL(`/rest/public/list/${store}`, this.options.cmsUrl);

      for (const p of path) {
        url.searchParams.append('p', p);
      }

      url.searchParams.set('mediaType', mediaType || this.options.mediaType);
      url.searchParams.set('v', variant);
      url.searchParams.set('page', String(pagination.page));
      url.searchParams.set('size', String(pagination.size));

      for (const [field, value] of Object.entries(filter)) {
        url.searchParams.set(`filter[${field}]`, String(value));
      }

      if (sort.length > 0) {
        url.searchParams.set(
          'sort',
          sort.map(({ field, sort }) => (sort === 'desc' ? `-${field}` : field)).join(','),
        );
      }

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      const locations: PagedResponse<ContentDescriptor> = await response.json();

      const content = await Promise.all(
        locations.content
          .map((descriptor) => {
            return {
              store: descriptor.store,
              path: descriptor.path,
              docId: descriptor.docId,
              variant: descriptor.variant,
              mediaType: descriptor.mediaType,
              provider: 'unknown',
              resourcePath: 'unknown',
              index: {},
            };
          })
          .map((location) => this.resolver.resolve(location)),
      );

      return {
        content,
        pagination: locations.pagination,
      };
    }
  }

  public async *stream(
    store: string,
    path: string[],
    variant: string = 'default',
    filter: ContentFilter = {},
    sort: ContentSort = [],
    mediaType?: string,
  ): AsyncGenerator<PublishedContent, void, void> {
    let page = 0;

    while (true) {
      const result = await this.find(
        store,
        path,
        variant,
        {
          page,
          size: 30,
        },
        filter,
        sort,
        mediaType,
      );

      if ('code' in result) {
        throw result;
      }

      for (const item of result.content) {
        yield item;
      }

      if (result.pagination.isLast) {
        return;
      }

      page++;
    }
  }
}
