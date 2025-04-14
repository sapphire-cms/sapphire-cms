import {DeliveryLayer} from './delivery.layer';
import {RenderedDocument} from '../../common';

/**
 * Delivery layer that simply ignores content to deliver.
 */
export class NullDeliveryLayer implements DeliveryLayer<void> {
  public deliverContent(renderedDocument: RenderedDocument): Promise<void> {
    console.dir(renderedDocument, { depth: null });
    return Promise.resolve();
  }
}
