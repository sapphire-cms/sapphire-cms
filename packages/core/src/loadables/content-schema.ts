import { z } from 'zod/mini';
import { idValidator, ValidationResult, Validator } from '../common';
import { moduleRefValidator, toZodRefinement } from '../kernel';
import {
  ContentSchema,
  ContentType,
  ContentVariantsSchema,
  FieldSchema,
  FieldTypeSchema,
  FieldValidatorSchema,
} from '../model';

const ZFieldTypeParamsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
);

const refValidator: Validator<string> = (value: string): ValidationResult => {
  return value.startsWith('@') ? moduleRefValidator(value) : idValidator(value);
};

const ZFieldTypeSchema = z.object({
  name: z.string().check(z.superRefine(toZodRefinement(refValidator))),
  params: z.optional(ZFieldTypeParamsSchema),
});

const ZValidatorSchema = z.object({
  name: z.string().check(z.superRefine(toZodRefinement(refValidator))),
  params: z.optional(ZFieldTypeParamsSchema),
});

type FieldShape = {
  name: string;
  label?: string;
  description?: string;
  example?: string;
  type: string | z.infer<typeof ZFieldTypeSchema>;
  isList?: boolean;
  required?: boolean;
  index?: boolean;
  validation?: Array<string | z.infer<typeof ZValidatorSchema>>;
  fields?: FieldShape[];
};

const ZFieldSchema: z.ZodMiniType<FieldShape> = z.lazy(() =>
  z
    .object({
      name: z.string().check(z.superRefine(toZodRefinement(idValidator))),
      label: z.optional(z.string()),
      description: z.optional(z.string()),
      example: z.optional(z.string()),
      type: z.union([
        z.string().check(z.superRefine(toZodRefinement(refValidator))),
        ZFieldTypeSchema,
      ]),
      isList: z._default(z.boolean(), false),
      required: z._default(z.boolean(), false),
      index: z._default(z.boolean(), false),
      validation: z.optional(z.array(z.union([z.string(), ZValidatorSchema]))),
      fields: z.optional(z.array(ZFieldSchema)),
    })
    .check(
      z.superRefine((data, ctx) => {
        const isGroup = data.type === 'group';

        if (isGroup && !data.fields) {
          ctx.addIssue({
            path: ['fields'],
            code: 'custom',
            message: "'fields' must be present when type is 'group'",
          });
        }

        if (!isGroup && data.fields) {
          ctx.addIssue({
            path: ['fields'],
            code: 'custom',
            message: "'fields' must be omitted unless type is 'group'",
          });
        }
      }),
    ),
);

const ZContentVariantsSchema = z.object({
  values: z.array(z.string()),
  default: z.optional(z.string()),
});

// TODO: extension mechanism for content sschema (presets)
export const ZContentSchema = z.object({
  name: z.string().check(z.superRefine(toZodRefinement(idValidator))),
  extends: z.optional(z.string()),
  label: z.optional(z.string()),
  description: z.optional(z.string()),
  type: z.enum(ContentType),
  variants: z.optional(z.union([z.array(z.string()), ZContentVariantsSchema])),
  fields: z.array(ZFieldSchema),
});

export function normalizeContentSchema(
  zContentSchema: z.infer<typeof ZContentSchema>,
): ContentSchema {
  return {
    name: zContentSchema.name,
    extends: zContentSchema.extends,
    label: zContentSchema.label,
    description: zContentSchema.description,
    type: zContentSchema.type,
    variants: normalizeVariants(zContentSchema),
    fields: zContentSchema.fields.map(normalizeField),
  };
}

function normalizeVariants(zContentSchema: z.infer<typeof ZContentSchema>): ContentVariantsSchema {
  let defaultVariant: string = 'default';
  let allVariants: string[] = [defaultVariant];

  if (Array.isArray(zContentSchema.variants)) {
    allVariants = zContentSchema.variants;
    defaultVariant = allVariants.length ? allVariants[0] : defaultVariant;
  } else if (zContentSchema.variants) {
    const variants = zContentSchema.variants as z.infer<typeof ZContentVariantsSchema>;
    allVariants = variants.values;

    if (variants.default) {
      defaultVariant = variants.default;
    } else if (allVariants.length) {
      defaultVariant = allVariants.length ? allVariants[0] : defaultVariant;
    }
  }

  return {
    values: allVariants,
    default: defaultVariant,
  };
}

function normalizeField(zFieldSchema: z.infer<typeof ZFieldSchema>): FieldSchema {
  const subfields = (zFieldSchema.fields || []).map(normalizeField);
  const validators = (zFieldSchema.validation || []).map(normalizeFieldValidator);

  return {
    name: zFieldSchema.name,
    label: zFieldSchema.label,
    description: zFieldSchema.description,
    example: zFieldSchema.example,
    isList: zFieldSchema.isList ?? false,
    required: zFieldSchema.required ?? false,
    index: zFieldSchema.index ?? false,
    type: normalizeFieldType(zFieldSchema.type),
    validation: validators,
    fields: subfields,
  };
}

function normalizeFieldType(
  zFieldType: string | z.infer<typeof ZFieldTypeSchema>,
): FieldTypeSchema {
  return typeof zFieldType === 'string'
    ? {
        name: zFieldType,
        params: {},
      }
    : {
        name: zFieldType.name,
        params: zFieldType.params || {},
      };
}

function normalizeFieldValidator(
  zFieldValidator: string | z.infer<typeof ZValidatorSchema>,
): FieldValidatorSchema {
  return typeof zFieldValidator === 'string'
    ? {
        name: zFieldValidator,
        params: {},
      }
    : {
        name: zFieldValidator.name,
        params: zFieldValidator.params || {},
      };
}
