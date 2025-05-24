import { SapphireModule } from '@sapphire-cms/core';
import { RestAdminLayer } from './rest-admin.layer';
import { RestManagementLayer } from './rest-management.layer';

@SapphireModule({
  name: 'rest',
  params: [] as const,
  layers: {
    admin: RestAdminLayer,
    management: RestManagementLayer,
  },
})
export default class RestModule {}
