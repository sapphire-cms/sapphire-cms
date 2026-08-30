export type Encoding = 'utf-8' | 'binary';

export type Artifact = {
  // TODO: specify format of slug
  slug: string;
  createdAt: string;
  lastModifiedAt: string;
  mime: string;
  extension: string;
  encoding: Encoding;
  content: Uint8Array;

  /** Flag telling us if this artifact is main. Generally main artifact contains a rendered content of the document. */
  isMain: boolean;
};

export type DeliveredArtifact = Artifact & {
  provider: string;
} & (
    | {
        /** Relative (to the root of delivery layer) path to delivered resource. */
        resourcePath: string;
      }
    | {
        url: string;
      }
  );
