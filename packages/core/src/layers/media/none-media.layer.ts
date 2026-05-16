import { Outcome } from 'defectless';
import { MediaError } from '../../kernel';
import { MediaAsset, UploadedMediaAsset } from '../../model';
import { MediaLayer } from './media.layer';

export class NoneMediaLayer implements MediaLayer {
  public uploadAsset(_mediaAsset: MediaAsset): Outcome<UploadedMediaAsset, MediaError> {
    return Outcome.failure(new MediaError('Media layer is not defined'));
  }

  public deleteAsset(_providerRef: string): Outcome<UploadedMediaAsset, MediaError> {
    return Outcome.failure(new MediaError('Media layer is not defined'));
  }
}
