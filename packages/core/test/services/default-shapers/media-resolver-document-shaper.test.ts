import {
  _resolveMdReferences,
  MediaResolverDocumentShaper,
  MediaResolverFieldShaper,
} from '../../../src/services/default-shapers';
import { failure, success } from 'defectless';
import { test, expect } from 'vitest';
import { dedent } from 'ts-dedent';
import { ShaperError } from '../../../src';

const fieldMediaResolverMock = {
  transform: (mediaDocRef: string) => {
    return mediaDocRef === 'cms-media/docs/examples/screenshot:default'
      ? success('https://media-hosting/docs/examples/screenshot.jpg')
      : failure(new ShaperError('Failed to resolve media'));
  },
} as unknown as MediaResolverFieldShaper;

const documentShaper = new MediaResolverDocumentShaper(fieldMediaResolverMock);

test('_resolveMdReferences', () => {
  const md = dedent`
    # Example

    Some code block:

    \`\`\`md
    ![Screenshot](cms-media:docs/examples/screenshot)
    \`\`\`

    Here is a media that will be resolved:

    ![Screenshot](cms-media:docs/examples/screenshot)

    And here is a literal code with an example of media that should be left as is:

    \`\`\`md
    ![Kitty](cms-media:animals/kitty)
    \`\`\`
  `;

  const expected = dedent`
    # Example

    Some code block:

    \`\`\`md
    ![Screenshot](cms-media:docs/examples/screenshot)
    \`\`\`

    Here is a media that will be resolved:

    ![Screenshot](https://media-hosting/docs/examples/screenshot.jpg)

    And here is a literal code with an example of media that should be left as is:

    \`\`\`md
    ![Kitty](cms-media:animals/kitty)
    \`\`\`
  `;

  const outcome = documentShaper[_resolveMdReferences](md);

  return outcome.match(
    (res) => {
      expect(res).toBe(expected);
    },
    (err) => {
      throw err;
    },
    (defect) => {
      throw defect;
    },
  );
});
