export type VariantMap = {
  variant: string;
  resourcePath: string;
  mime: string;
  createdAt: string;
  lastModifiedAt: string;
};

export type DocumentMap = {
  docId: string;
  variants: Record<string, VariantMap | undefined> & {
    default?: VariantMap;
  };
};

export type StoreMap = {
  store: string,
  documents: {
    [slug: string]: DocumentMap,
  }
};

export type ContentMap = {
  createdAt: string;
  lastModifiedAt: string;
  stores: {
    [store: string]: StoreMap,
  }
}
