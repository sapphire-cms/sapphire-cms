type Timestamped = {
  createdAt: string;
  lastModifiedAt: string;
};

export type ContentLocationMap = {
  provider: string;
  resourcePath?: string;
  url?: string;
} & Timestamped;

export type ArtifactMap = {
  mime: string;
  delivered: {
    [provider: string]: ContentLocationMap;
  };
} & Timestamped;

export type VariantMap = {
  variant: string;
  index: {
    [field: string]: string | number | boolean | (string | number | boolean)[];
  };
  rendered: {
    [mime: string]: ArtifactMap;
  };
} & Timestamped;

export type DocumentMap = {
  docId: string;
  variants: Record<string, VariantMap> & {
    default?: VariantMap;
  };
} & Timestamped;

export type StoreMap = {
  store: string;
  documents: {
    [slug: string]: DocumentMap;
  };
} & Timestamped;

export type ContentMap = {
  version: string;
  stores: {
    [store: string]: StoreMap;
  };
} & Timestamped;
