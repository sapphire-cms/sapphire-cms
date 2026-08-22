import {
  ContentFilter,
  ContentPagination,
  ContentSort,
  emptyPagedResponse,
  PagedResponse,
} from '../../kernel';
import { ContentLocationMap, DocumentMap, ArtifactMap, StoreMap, VariantMap } from '../../model';
import { ContentLocation, ContentLocator } from './content-locator';

export class StaticStoreContentLocator implements ContentLocator {
  constructor(private readonly storeMap: StoreMap) {}

  public resolve(
    store: string,
    path: string[],
    docId: string,
    variant: string,
    mediaType: string,
  ): ContentLocation | undefined {
    if (store != this.storeMap.store) {
      return undefined;
    }

    const slug = [...path, docId].join('/');

    const documentMap: DocumentMap | undefined = this.storeMap?.documents[slug];
    const variantMap: VariantMap | undefined = documentMap?.variants[variant];
    const renderedMap: ArtifactMap | undefined = variantMap?.rendered[mediaType];
    const contentLocation: ContentLocationMap | undefined = Object.values(
      renderedMap?.delivered || {},
    )[0];

    if (!contentLocation) {
      return undefined;
    }

    return contentLocation
      ? ({
          store,
          path,
          docId,
          variant,
          mediaType,
          index: variantMap.index,
          provider: contentLocation.provider,
          resourcePath: contentLocation.resourcePath,
          url: contentLocation.url,
        } as ContentLocation)
      : undefined;
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
    if (store != this.storeMap.store) {
      return emptyPagedResponse(pagination.page, pagination.size);
    }

    const slugPrefix = path.join('/');

    const matchingDocuments: DocumentMap[] = Object.entries(this.storeMap.documents)
      .filter(([slug]: [string, DocumentMap]) => slug.startsWith(slugPrefix))
      .map(([_slug, docMap]: [string, DocumentMap]) => docMap);

    type Variant = VariantMap & { docId: string };

    const matchingVariants: Variant[] = matchingDocuments
      .flatMap((docMap) => {
        return Object.values(docMap.variants).map((variantMap) =>
          Object.assign(variantMap, { docId: docMap.docId }),
        );
      })
      .filter((variantMap) => !criteria.variants || criteria.variants.includes(variantMap.variant))
      .filter((variantMap) => StaticStoreContentLocator.matches(variantMap, filter))
      .sort(StaticStoreContentLocator.variantComparator(sort));

    type Index = {
      [field: string]: string | number | boolean | (string | number | boolean)[];
    };
    type Artifact = ArtifactMap & { docId: string; variant: string; index: Index };

    const matchingArtifacts: Artifact[] = matchingVariants
      .flatMap((variantMap) => {
        return Object.values(variantMap.rendered).map((artifactMap) =>
          Object.assign(artifactMap, {
            docId: variantMap.docId,
            variant: variantMap.variant,
            index: variantMap.index,
          }),
        );
      })
      .filter(
        (artifactMap) => !criteria.mediaTypes || criteria.mediaTypes.includes(artifactMap.mime),
      );

    type Location = ContentLocationMap & {
      docId: string;
      variant: string;
      index: Index;
      mediaType: string;
    };

    const matchingLocations: Location[] = matchingArtifacts
      .flatMap((artifactMap) => {
        return Object.values(artifactMap.delivered).map((location) =>
          Object.assign(location, {
            docId: artifactMap.docId,
            variant: artifactMap.variant,
            index: artifactMap.index,
            mediaType: artifactMap.mime,
          }),
        );
      })
      .filter((location) => !criteria.providers || criteria.providers.includes(location.provider));

    const content: ContentLocation[] = matchingLocations
      .slice(pagination.page * pagination.size, (pagination.page + 1) * pagination.size)
      .map((location) => {
        return {
          store,
          path,
          docId: location.docId,
          variant: location.variant,
          mediaType: location.mediaType,
          provider: location.provider,
          index: location.index,
          resourcePath: location.resourcePath,
          url: location.url,
        } as ContentLocation;
      });

    return {
      content,
      pagination: {
        pageNumber: pagination.page,
        pageSize: pagination.size,
        totalElements: matchingLocations.length,
        totalPages: Math.ceil(matchingLocations.length / pagination.size),
        isLast: (pagination.page + 1) * pagination.size >= matchingLocations.length,
      },
    };
  }

  private static matches(variant: VariantMap, filter: ContentFilter): boolean {
    for (const [field, expectedValue] of Object.entries(filter)) {
      if (expectedValue != variant.index[field]) {
        return false;
      }
    }

    return true;
  }

  private static variantComparator(
    sort: ContentSort,
  ): (variant1: VariantMap, variant2: VariantMap) => number {
    return (variant1, variant2) => {
      for (const { field, sort: direction } of sort) {
        const value1 = variant1.index[field];
        const value2 = variant2.index[field];

        if (value1 === value2) {
          continue;
        }

        // Undefined fields go last
        if (value1 === undefined) {
          return 1;
        }

        if (value2 === undefined) {
          return -1;
        }

        // Arrays are not sortable
        if (Array.isArray(value1) || Array.isArray(value2)) {
          return 0;
        }

        let result: number = 0;

        if (typeof value1 === 'string' && typeof value2 === 'string') {
          result = value1.localeCompare(value2);
        } else if (typeof value1 === 'number' && typeof value2 === 'number') {
          result = value1 - value2;
        } else if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
          result = Number(value1) - Number(value2);
        }

        if (result !== 0) {
          return direction === 'asc' ? result : -result;
        }
      }

      return 0;
    };
  }
}
