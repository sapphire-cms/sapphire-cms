import { failure, Outcome, success } from 'defectless';
import { AnyParams, Option } from '../../common';
import { ShaperError } from '../../kernel';
import { ITransformer, MediaLayer, PersistenceLayer } from '../../layers';
import { DocumentReference, MissingDocumentError } from '../../model';

export class MediaResolverFieldShaper implements ITransformer<string, string> {
  constructor(
    private readonly persistenceLayer: PersistenceLayer<AnyParams>,
    private readonly mediaLayer: MediaLayer<AnyParams>,
  ) {}

  public transform(mediaDocRef: string): Outcome<string, ShaperError> {
    const ref = DocumentReference.parse(mediaDocRef);
    return this.persistenceLayer
      .getFromTree(ref.store, ref.path, ref.docId!, ref.variant!)
      .flatMap((docOption) => {
        if (Option.isSome(docOption)) {
          return success(docOption.value.content.providerRef as string);
        } else {
          return failure(new MissingDocumentError(ref));
        }
      })
      .flatMap((providerRef) => this.mediaLayer.getAsset(providerRef))
      .map((res) => {
        return 'url' in res ? res.url : MediaResolverFieldShaper.toCanonicalUri(ref);
      })
      .mapFailure((err) => new ShaperError('Failed to resolve media', err));
  }

  private static toCanonicalUri(mediaRef: DocumentReference): string {
    const ref = [...mediaRef.path, mediaRef.docId].join('/');
    return `${mediaRef.store}:${ref}`;
  }
}
