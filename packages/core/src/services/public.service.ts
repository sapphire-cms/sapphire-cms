import { Outcome, Program, program, success } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { Option } from '../common';
import {
  ContentFilter,
  ContentPagination,
  ContentSort,
  createModuleRef,
  DeliveryError,
  DI_TOKENS,
  emptyPagedResponse,
  PagedResponse,
  PersistenceError,
} from '../kernel';
import { ContentDescriptor, ContentLocation, PublicLayer, StaticContentLocator } from '../layers';
import { ContentMap } from '../model';
import { CmsContext } from './cms-context';
import { ContentMapService } from './content-map.service';

@singleton()
export class PublicService {
  constructor(
    @inject(CmsContext) private readonly cmsContext: CmsContext,
    @inject(ContentMapService) private readonly contentMapService: ContentMapService,
    @inject(DI_TOKENS.PublicLayer) private readonly publicLayer: PublicLayer,
  ) {
    this.publicLayer.getContentPort.accept((store, path, docId, variant, mediaType) => {
      return this.getContent(store, path, docId, variant, mediaType);
    });

    this.publicLayer.listContentPort.accept(
      (store, path, mediaType, variants, pagination, filter, sort) => {
        return this.listContent(store, path, mediaType, variants, pagination, filter, sort);
      },
    );
  }

  public getContent(
    store: string,
    path: string[],
    docId: string,
    variant: string,
    mediaType: string,
  ): Outcome<
    Option<Uint8Array | string | { url: string } | object>,
    PersistenceError | DeliveryError
  > {
    return program(function* (): Program<
      Option<Uint8Array | string | { url: string } | object>,
      PersistenceError | DeliveryError
    > {
      const locationOption: Option<ContentLocation> = yield this.resolveLocation(
        store,
        path,
        docId,
        variant,
        mediaType,
      );

      if (Option.isNone(locationOption)) {
        return success(Option.none());
      }

      const location = locationOption.value;

      if ('url' in location && location.url) {
        return success(Option.some({ url: location.url }));
      }

      const deliveryLayer = this.cmsContext.deliveryLayers.get(createModuleRef(location.provider));

      if (!deliveryLayer) {
        console.error(`Delivery layer '${location.provider}' is not plugged.`);
        return success(Option.none());
      }

      const contentOption: Option<Uint8Array> = yield deliveryLayer.getArtifactContent(
        (location as { resourcePath: string }).resourcePath,
      );

      if (Option.isNone(contentOption)) {
        return success(Option.none());
      }

      const content = contentOption.value;

      if (location.mediaType === 'application/json') {
        const json: object = JSON.parse(new TextDecoder().decode(content));
        return success(Option.some(json));
      } else if (location.encoding === 'utf-8') {
        const text = new TextDecoder().decode(content);
        return success(Option.some(text));
      }

      return success(contentOption);
    }, this);
  }

  public listContent(
    store: string,
    path: string[],
    mediaType: string,
    variants: string[] | undefined,
    pagination: ContentPagination,
    filter: ContentFilter,
    sort: ContentSort,
  ): Outcome<PagedResponse<ContentDescriptor>, PersistenceError> {
    return this.listLocations(
      store,
      path,
      {
        variants,
        mediaTypes: [mediaType],
      },
      pagination,
      filter,
      sort,
    ).map((response) => {
      const content: ContentDescriptor[] = response.content.map((location) => {
        return {
          store: location.store,
          path: location.path,
          docId: location.docId,
          variant: location.variant,
          mediaType: location.mediaType,
          encoding: location.encoding,
          index: location.index,
        };
      });

      return {
        content,
        pagination: response.pagination,
      };
    });
  }

  public resolveLocation(
    store: string,
    path: string[],
    docId: string,
    variant: string,
    mediaType: string,
  ): Outcome<Option<ContentLocation>, PersistenceError> {
    return program(function* (): Program<Option<ContentLocation>, PersistenceError> {
      const contentMapOption: Option<ContentMap> = yield this.contentMapService.getContentMap();

      if (Option.isNone(contentMapOption)) {
        return success(Option.none());
      }

      const locator = new StaticContentLocator(contentMapOption.value);
      const location = locator.locate(store, path, docId, variant, mediaType);

      return success(Option.fromNullable(location));
    }, this);
  }

  public listLocations(
    store: string,
    path: string[],
    criteria: { variants?: string[]; mediaTypes?: string[]; providers?: string[] },
    pagination: ContentPagination,
    filter: ContentFilter,
    sort: ContentSort,
  ): Outcome<PagedResponse<ContentLocation>, PersistenceError> {
    return program(function* (): Program<PagedResponse<ContentLocation>, PersistenceError> {
      const contentMapOption: Option<ContentMap> = yield this.contentMapService.getContentMap();

      if (Option.isNone(contentMapOption)) {
        return success(emptyPagedResponse(pagination.page, pagination.size));
      }

      const locator = new StaticContentLocator(contentMapOption.value);
      const response = locator.list(store, path, criteria, pagination, filter, sort);

      return success(response);
    }, this);
  }
}
