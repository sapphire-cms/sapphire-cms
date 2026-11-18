import {
  AnyParams,
  Option,
  ContentFilter,
  ContentPagination,
  ContentSort,
  PagedResponse,
} from '../../common';
import { AfterPortsBoundAware, HttpLayer, Layer, OuterError, Port } from '../../kernel';
import { AssetUrl, Encoding, MissingDocumentError, UploadedMediaAsset } from '../../model';

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

  resolveMediaPort: Port<
    (path: string[], mediaId: string) => UploadedMediaAsset | AssetUrl,
    MissingDocumentError | OuterError
  >;
}
