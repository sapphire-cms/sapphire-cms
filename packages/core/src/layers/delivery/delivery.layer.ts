import {Layer} from '../../kernel';
import {RenderedDocument} from '../../common';

export interface DeliveryLayer<Config> extends Layer<Config> {
  deliverContent(renderedDocument: RenderedDocument): Promise<void>;
}
