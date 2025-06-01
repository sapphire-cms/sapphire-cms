import { AnyParams } from '../../common';
import { AfterPortsBoundAware, Layer, OuterError, Port } from '../../kernel';
import { HttpLayer } from '../../kernel/http-layer';

export interface AdminLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config>,
    HttpLayer,
    AfterPortsBoundAware {
  installPackagesPort: Port<(packageNames: string[]) => void, OuterError>;
  removePackagesPort: Port<(packageNames: string[]) => void, OuterError>;
  haltPort: Port<() => void>;
}
