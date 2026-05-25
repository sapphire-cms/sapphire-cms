import { failure, Outcome, success } from 'defectless';
import { MediaError } from '../../kernel';
import { MediaAsset, UploadedMediaAsset } from '../../model';
import { MediaLayer } from './media.layer';

export class NoneMediaLayer implements MediaLayer {
  public prepareMediaRepo(): Outcome<void, MediaError> {
    // DO NOTHING
    return success();
  }
  public uploadAsset(_mediaAsset: MediaAsset): Outcome<UploadedMediaAsset, MediaError> {
    return failure(new MediaError('Media layer is not defined'));
  }

  public deleteAsset(_providerRef: string): Outcome<void, MediaError> {
    return failure(new MediaError('Media layer is not defined'));
  }
}
