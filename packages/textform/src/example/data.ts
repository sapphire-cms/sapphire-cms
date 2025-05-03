import { dedent } from 'ts-dedent';
import { TextForm } from '../textform.types';

const banner = dedent`
  example.textform
  Sponsor Tiers
  Collection of available sponsor tiers
  Creating a new document.
  Note: Lines starting with character "%" are comments. They are here to help you. Do not edit them.
        For multi-entry fields, use lines containing at least three equals signs "===" to separate entries.
`;

const markdown = dedent`
The **Quartz tier** is open to anyone who wants to contribute their **grain of sand** to the foundation of the next generation of CMS.

Whether you're a **small developer agency or a professional user** who loves Sapphire CMS, your support means the world to us.

Your contribution helps us move faster, build better, and keep the project truly open.

#### You’ll receive:

- Your company’s logo displayed in the Supporters section on our website.
- A thank-you shoutout on our social media channels.
`;

export const form: TextForm = {
  banner,
  fields: [
    {
      name: 'id',
      type: 'string',
      values: ['_r2d2'],
      commentBlock: {
        label: 'Tier ID',
        isRequired: true,
        declaredType: 'id',
        description: 'Technical ID of the tier',
        example: 'lovely_doc-4238',
        errors: ['Id cannot start with "_"'],
      },
    },
    {
      name: 'tier',
      type: 'string',
      values: ['Quartz Supporter'],
      commentBlock: {
        label: 'Tier Name',
        isRequired: true,
        declaredType: 'text',
        description: 'A catchy name for the sponsor tier.',
      },
    },
    {
      name: 'available',
      type: 'boolean',
      values: [true],
      commentBlock: {
        label: 'Is Tier Available',
        isRequired: true,
        declaredType: 'check',
        notes: [
          'this is a check field. Put anything between square brackets to check it. Leave it empty is unchecked.',
        ],
      },
    },
    {
      name: 'category',
      type: 'string',
      values: [' #sponsor'],
      commentBlock: {
        label: 'Sponsor Tier Category',
        isRequired: false,
        declaredType: 'tag',
        notes: ['One of (Cannot choose many): #sponsor #partner #founding partner'],
      },
    },
    {
      name: 'donation',
      type: 'number',
      values: ['500'],
      commentBlock: {
        label: 'Donation Amount',
        isRequired: true,
        description: 'Required donation amount in USD.',
      },
    },
    {
      name: 'forWhom',
      type: 'string',
      values: ['Small Dev Agencies', 'Indie Devs'],
      commentBlock: {
        label: 'Preferred Targets',
        declaredType: 'text',
        notes: [
          'this is a multi-entries field. Separate you entries with lines containing at least three equals signs "===".',
        ],
      },
    },
    {
      name: 'description',
      type: 'string',
      values: [markdown],
      commentBlock: {
        label: 'Tier Description',
        isRequired: true,
        declaredType: 'rich-text',
        notes: ['this is a rich text field. It accepts content written with Markdown.'],
      },
    },
  ],
};
