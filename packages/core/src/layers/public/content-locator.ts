import { ContentFilter, ContentPagination, ContentSort, PagedResponse } from '../../kernel';
import { Encoding } from '../../model';

export type ContentLocation = {
  store: string;
  path: string[];
  docId: string;
  variant: string;
  mediaType: string;
  encoding: Encoding;
  provider: string;
  index: {
    [field: string]: string | number | boolean | (string | number | boolean)[];
  };
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
  locate(
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
