import { Outcome } from 'defectless';
import { AnyParams, Option } from '../../common';
import {
  ContentFilter,
  ContentPagination,
  ContentSort,
  createPort,
  Framework,
  OuterError,
  PagedResponse,
} from '../../kernel';
import { ContentDescriptor, PublicLayer } from './public.layer';

export abstract class AbstractPublicLayer<Config extends AnyParams | undefined = undefined>
  implements PublicLayer<Config>
{
  public abstract readonly framework: Framework;

  public readonly getContentPort = createPort<
    (
      store: string,
      path: string[],
      docId: string,
      variant: string,
      mediaType: string,
    ) => Option<Uint8Array | string | { url: string } | object>,
    OuterError
  >();

  public readonly listContentPort = createPort<
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
  >();

  public abstract afterPortsBound(): Outcome<void, never>;
}
