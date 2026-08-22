import { ContentLocation, DocumentReference } from '@sapphire-cms/core';
import { PublishedContent } from './published-content';

export class ContentResolver {
  constructor(private readonly cmsUrl?: string) {}

  public async resolve(location: ContentLocation): Promise<PublishedContent> {
    let response: Response | undefined;

    if ('url' in location && location.url) {
      response = await fetch(location.url, {
        headers: {
          Accept: location.mediaType,
        },
      });
    } else if (this.cmsUrl) {
      const url = new URL(`/rest/public/content/${location.store}`, this.cmsUrl);

      for (const path of location.path) {
        url.searchParams.append('p', path);
      }

      url.searchParams.set('d', location.docId);
      url.searchParams.set('v', location.variant);

      response = await fetch(url, {
        headers: {
          Accept: location.mediaType,
        },
      });
    }

    const docRef = new DocumentReference(
      location.store,
      location.path,
      location.docId,
      location.variant,
    );

    if (!response) {
      return Promise.reject({
        code: 404,
        reason: `Failed to resolve content ${docRef.toString()}.`,
      });
    }

    const mime = response.headers.get('Content-Type');
    if (!mime?.includes(location.mediaType)) {
      return Promise.reject({
        code: 415,
        reason: `Unexpected type of content ${docRef.toString()}. Expected: '${location.mediaType}'; Provided: '${mime}';`,
      });
    }

    let binary: Uint8Array | undefined;
    let text: string | undefined;
    let json: object | undefined;

    if (location.mediaType === 'application/json') {
      json = await response.json();
    } else if (location.mediaType.startsWith('text/')) {
      text = await response.text();
    } else {
      binary = await response.bytes();
    }

    return new PublishedContent(location, binary, text, json);
  }
}
