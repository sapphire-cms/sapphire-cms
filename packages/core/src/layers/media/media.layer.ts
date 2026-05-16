import { Outcome } from 'defectless';
import { AnyParams } from '../../common';
import { Layer, MediaError } from '../../kernel';
import { MediaAsset, UploadedMediaAsset } from '../../model';

export interface MediaLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  uploadAsset(mediaAsset: MediaAsset): Outcome<UploadedMediaAsset, MediaError>;
  deleteAsset(providerRef: string): Outcome<UploadedMediaAsset, MediaError>;
}
