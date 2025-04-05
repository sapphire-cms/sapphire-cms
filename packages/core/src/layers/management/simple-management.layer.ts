import {ManagementLayer} from './management.layer';
import {Document, Port} from '../../common';

export class SimpleManagementLayer implements ManagementLayer<void> {
  public readonly createEmptyDocumentPort = new Port<string, Document<any>>();
  public readonly getDocumentPort = new Port<{ store: string, id: string }, Document<any>>();
  public readonly putDocumentPort = new Port<{ store: string, document: Document<any> }, Document<any>>();

  public afterPortsBound(): Promise<void> {
    // DO NOTHING
    return Promise.resolve();
  }

  public async createEmptyDocument<T>(store: string): Promise<Document<T>> {
    return {} as unknown as Document<T>;
  }

  public async getDocument<T>(store: string, id: string): Promise<Document<T>> {
    return {} as unknown as Document<T>;
  }

  public async putDocument<T>(store: string, document: Document<T>): Promise<Document<T>> {
    return document;
  }
}
