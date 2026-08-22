import {
  ContentFilter,
  ContentLocation,
  ContentLocator,
  ContentMap,
  ContentPagination,
  ContentSort,
  PagedResponse,
  StaticContentLocator,
} from '@sapphire-cms/core';

export interface ClientContentLocator {
  locate(
    store: string,
    path: string[],
    docId: string,
    variant: string,
    mediaType: string,
  ): Promise<ContentLocation | undefined>;

  list(
    store: string,
    path: string[],
    criteria: { variants?: string[]; mediaTypes?: string[]; providers?: string[] },
    pagination: ContentPagination,
    filter: ContentFilter,
    sort: ContentSort,
  ): Promise<PagedResponse<ContentLocation>>;
}

export class StaticClientContentLocator implements ClientContentLocator {
  private readonly locator: ContentLocator;

  constructor(contentMap: ContentMap) {
    this.locator = new StaticContentLocator(contentMap);
  }

  public locate(
    store: string,
    path: string[],
    docId: string,
    variant: string,
    mediaType: string,
  ): Promise<ContentLocation | undefined> {
    return Promise.resolve(this.locator.locate(store, path, docId, variant, mediaType));
  }

  public list(
    store: string,
    path: string[],
    criteria: { variants?: string[]; mediaTypes?: string[]; providers?: string[] },
    pagination: ContentPagination,
    filter: ContentFilter,
    sort: ContentSort,
  ): Promise<PagedResponse<ContentLocation>> {
    return Promise.resolve(this.list(store, path, criteria, pagination, filter, sort));
  }
}

export class ExternalMapContentLocator implements ClientContentLocator {
  private locator?: ContentLocator;
  private fetchTimestamp?: number;

  constructor(
    private readonly contentMapUrl: string,
    private readonly ttlSeconds: number = 300,
  ) {}

  public async locate(
    store: string,
    path: string[],
    docId: string,
    variant: string,
    mediaType: string,
  ): Promise<ContentLocation | undefined> {
    await this.refreshLocator();
    return this.locator!.locate(store, path, docId, variant, mediaType);
  }

  public async list(
    store: string,
    path: string[],
    criteria: { variants?: string[]; mediaTypes?: string[]; providers?: string[] },
    pagination: ContentPagination,
    filter: ContentFilter,
    sort: ContentSort,
  ): Promise<PagedResponse<ContentLocation>> {
    await this.refreshLocator();
    return this.list(store, path, criteria, pagination, filter, sort);
  }

  private async refreshLocator(): Promise<void> {
    const now = Date.now();

    if (
      this.locator &&
      this.fetchTimestamp !== undefined &&
      now - this.fetchTimestamp < this.ttlSeconds * 1000
    ) {
      return;
    }

    const response = await fetch(this.contentMapUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return Promise.reject({
        code: 500,
        reason: `Unable to fetch external content map.`,
      });
    }

    const mime = response.headers.get('Content-Type');

    if (!mime?.includes('application/json')) {
      return Promise.reject({
        code: 415,
        reason: `External content map should be in JSON format.`,
      });
    }

    const contentMap: ContentMap = await response.json();

    this.locator = new StaticContentLocator(contentMap);
    this.fetchTimestamp = now;
  }
}
