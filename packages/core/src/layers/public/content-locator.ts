import { ContentFilter, ContentPagination, ContentSort, PagedResponse } from '../../kernel';

export type ContentLocation = {
  store: string;
  path: string[];
  docId: string;
  variant: string;
  mediaType: string;
  provider: string;
} & (
  | {
      /** Relative (to the root of delivery layer) path to delivered resource. */
      resourcePath: string;
    }
  | {
      url: string;
    }
);

export interface ContentLocator {
  resolve(
    store: string,
    path: string[],
    docId: string,
    variant: string,
    mediaType: string,
  ): ContentLocation | undefined;

  list(
    store: string,
    path: string[],
    criteria: { variants?: string[]; mediaTypes?: string[]; providers?: string[] },
    pagination: ContentPagination,
    filter: ContentFilter,
    sort: ContentSort,
  ): PagedResponse<ContentLocation>;
}
