import { getBuildParamsType, SapphireModule } from '@sapphire-cms/core';
import CloudinaryMediaLayer from './cloudinary-media.layer';

const moduleParamsDef = [
  {
    name: 'cloudName',
    type: 'string',
    required: true,
    description: 'Cloudinary cloud name.',
  },
  {
    name: 'apiKey',
    type: 'string',
    required: true,
    description: 'Cloudinary API key.',
  },
  {
    name: 'apiSecret',
    type: 'string',
    required: true,
    description: 'Cloudinary API secret.',
  },
] as const;

const _params = getBuildParamsType(moduleParamsDef);
export type CloudinaryModuleParams = typeof _params;

@SapphireModule({
  name: 'cloudinary',
  params: moduleParamsDef,
  layers: {
    media: CloudinaryMediaLayer,
  },
})
export default class CloudinaryModule {}
