import { ContentLocation } from '@sapphire-cms/core';

export class PublishedContent {
  public readonly store: string;
  public readonly path: string[];
  public readonly docId: string;
  public readonly variant: string;
  public readonly mediaType: string;
  public readonly index: {
    [field: string]: string | number | boolean | (string | number | boolean)[];
  };

  constructor(
    location: ContentLocation,
    public readonly asBinary: Uint8Array | undefined,
    public readonly asText: string | undefined,
    public readonly asJson: object | undefined,
  ) {
    this.store = location.store;
    this.path = location.path;
    this.docId = location.docId;
    this.variant = location.variant;
    this.mediaType = location.mediaType;
    this.index = location.index;
  }

  public get isJson(): boolean {
    return !!this.asJson;
  }

  public get isText(): boolean {
    return !!this.asText;
  }

  public get isBinary(): boolean {
    return !!this.asBinary;
  }
}
