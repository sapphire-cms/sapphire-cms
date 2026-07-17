import {
  ContentFilter,
  ContentPagination,
  ContentSort,
  emptyPagedResponse,
  PagedResponse,
} from '../../kernel';
import { ContentMap } from '../../model';
import { ContentLocation, ContentLocator } from './content-locator';
import { StaticStoreContentLocator } from './static-store-content-locator';

export class StaticContentLocator implements ContentLocator {
  private readonly storeLocators = new Map<string, ContentLocator>();

  constructor(contentMap: ContentMap) {
    for (const [store, storeMap] of Object.entries(contentMap.stores)) {
      const storeLocator = new StaticStoreContentLocator(storeMap);
      this.storeLocators.set(store, storeLocator);
    }
  }

  public resolve(
    store: string,
    path: string[],
    docId: string,
    variant: string,
    mediaType: string,
  ): ContentLocation | undefined {
    const storeLocator = this.storeLocators.get(store);
    return storeLocator ? storeLocator.resolve(store, path, docId, variant, mediaType) : undefined;
  }

  public list(
    store: string,
    path: string[],
    criteria: {
      variants?: string[];
      mediaTypes?: string[];
      providers?: string[];
    },
    pagination: ContentPagination,
    filter: ContentFilter,
    sort: ContentSort,
  ): PagedResponse<ContentLocation> {
    const storeLocator = this.storeLocators.get(store);

    if (!storeLocator) {
      return emptyPagedResponse(pagination.page, pagination.size);
    }

    return storeLocator.list(store, path, criteria, pagination, filter, sort);
  }
}
