import { MediaAsset, MediaError, MediaLayer, UploadedMediaAsset } from '@sapphire-cms/core';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Outcome, success } from 'defectless';
import * as packageJson from '../package.json';
import { CloudinaryModuleParams } from './cloudinary.module';

export default class CloudinaryMediaLayer implements MediaLayer<CloudinaryModuleParams> {
  constructor(params: CloudinaryModuleParams) {
    cloudinary.config({
      cloud_name: params.cloudName,
      api_key: params.apiKey,
      api_secret: params.apiSecret,
    });
  }

  public prepareMediaRepo(): Outcome<void, MediaError> {
    return success();
  }

  public uploadAsset(mediaAsset: MediaAsset): Outcome<UploadedMediaAsset, MediaError> {
    const path = mediaAsset.slug.split('/');
    const docId = path.pop()!;

    return Outcome.fromCallback<UploadApiResponse, MediaError>((onSuccess, onFailure) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: mediaAsset.type,
          folder: path.join('/'),
          public_id: docId,
          use_asset_folder_as_public_id_prefix: true,
        },
        (error, result) => {
          if (error) {
            onFailure(new MediaError(`Failed to upload media file ${mediaAsset.slug}`, error));
          } else {
            onSuccess(result!);
          }
        },
      );

      stream.end(Buffer.from(mediaAsset.content));
    }).map((response) => {
      return Object.assign(mediaAsset, {
        provider: `cloudinary@${packageJson.version}`,
        providerRef: response.public_id,
      });
    });
  }

  public deleteAsset(providerRef: string): Outcome<void, MediaError> {
    return Outcome.fromSupplier(
      () => cloudinary.uploader.destroy(providerRef),
      (cloudinaryError) =>
        new MediaError(`Failed to delete media file ${providerRef}`, cloudinaryError),
    );
  }
}
