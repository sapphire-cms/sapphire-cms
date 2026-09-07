import { ITransformer, SapphireFieldShaper, ShaperError } from '@sapphire-cms/core';
import { Outcome } from 'defectless';
import { marked } from 'marked';

@SapphireFieldShaper({
  name: 'md2html',
  forTypes: ['string'] as const,
  params: [] as const,
})
export class Md2HtmlShaper implements ITransformer<string, string> {
  public transform(markdown: string): Outcome<string, ShaperError> {
    return Outcome.fromSupplier(
      () => marked.parse(markdown, { async: true }),
      (err) => new ShaperError('Failed to parse markdown.', err),
    );
  }
}
