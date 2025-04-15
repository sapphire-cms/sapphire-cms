export type ContentMap = {
  store: string;
  createdAt: string;
  lastModifiedAt: string;
  documents: {
    slug: string;

    // TODO: think about what resources are even mean
    resources: {
      resourcePath: string;
      mime: string;
      createdAt: string;
      lastModifiedAt: string;
    }[];
  }[];
}
