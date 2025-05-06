import { AnyParams } from '../../common';
import { AfterPortsBoundAware, Layer, OuterError, Port } from '../../kernel';
import { HydratedContentSchema } from '../../model';

export interface AdminLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config>,
    AfterPortsBoundAware {
  installPackagesPort: Port<(packageNames: string[]) => void, OuterError>;
  removePackagesPort: Port<(packageNames: string[]) => void, OuterError>;

  getContentSchemasPort: Port<() => HydratedContentSchema[]>;

  haltPort: Port<() => void>;
}
