import { SapphireModule } from '@sapphire-cms/core';
import { RestAdminLayer } from './rest-admin.layer';
import { RestManagementLayer } from './rest-management.layer';
import { RestPublicLayer } from './rest-public.layer';

@SapphireModule({
  name: 'rest',
  params: [] as const,
  layers: {
    admin: RestAdminLayer,
    management: RestManagementLayer,
    public: RestPublicLayer,
  },
})
export default class RestModule {}
