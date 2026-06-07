import { DocumentContent } from './document';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export type MediaDocumentContent = DocumentContent & {
  type: MediaType;

  provider: string; // Media Provider layer name@version
  providerRef: string; // Media reference specific to used provider

  mimeType: string;
  sizeInBytes?: number;

  width?: number;
  height?: number;
  durationInMs?: number;

  title?: string;
  alt?: string;
  caption?: string;

  metadata: string[];
};

export type MediaMetadataDocumentContent = DocumentContent & {
  key: string;
  value: string;
};

export type MediaAsset = {
  type: MediaType;
  // TODO: validation of slugs format
  slug: string;
  mimeType: string;
  content: Uint8Array;

  properties: {
    sizeInBytes?: number;
    width?: number;
    height?: number;
    durationInMs?: number;
    title?: string;
    alt?: string;
    caption?: string;
  };

  metadata: Record<string, string>;
};

export type UploadedMediaAsset = MediaAsset & {
  provider: string; // Media Provider layer name@version
  providerRef: string; // Media reference specific to used provider
};

export type AssetUrl = {
  url: string;
};
