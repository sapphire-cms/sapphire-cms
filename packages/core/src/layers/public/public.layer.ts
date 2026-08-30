import { AnyParams, Option } from '../../common';
import {
  AfterPortsBoundAware,
  ContentFilter,
  ContentPagination,
  ContentSort,
  HttpLayer,
  Layer,
  OuterError,
  PagedResponse,
  Port,
} from '../../kernel';
import { Encoding } from '../../model';

export type ContentDescriptor = {
  store: string;
  path: string[];
  docId: string;
  variant: string;
  mediaType: string;
  encoding: Encoding;
  index: {
    [field: string]: string | number | boolean | (string | number | boolean)[];
  };
};

export interface PublicLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config>,
    HttpLayer,
    AfterPortsBoundAware {
  getContentPort: Port<
    (
      store: string,
      path: string[],
      docId: string,
      variant: string,
      mediaType: string,
    ) => Option<Uint8Array | string | { url: string } | object>,
    OuterError
  >;

  listContentPort: Port<
    (
      store: string,
      path: string[],
      mediaType: string,
      variants: string[] | undefined,
      pagination: ContentPagination,
      filter: ContentFilter,
      sort: ContentSort,
    ) => PagedResponse<ContentDescriptor>,
    OuterError
  >;
}
