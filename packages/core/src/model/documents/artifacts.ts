// TODO: add file extention here to avoid guessing it in delivery layers
export type Artifact = {
  // TODO: specify format of slug
  slug: string;
  createdAt: string;
  lastModifiedAt: string;
  mime: string;
  content: Uint8Array;

  /** Flag telling us if this artifact is main. Generally main artifact contains a rendered content of the document. */
  isMain: boolean;
};

export type DeliveredArtifact = Artifact & {
  /** Relative (to the root of delivery layer) path to delivered resource. */
  resourcePath: string;
};
