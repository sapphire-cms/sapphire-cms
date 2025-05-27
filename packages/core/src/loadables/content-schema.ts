import { z, ZodType } from 'zod';
import { idValidator, toZodRefinement, ValidationResult, Validator } from '../common';
import { moduleRefValidator } from '../kernel';
import {
  ContentSchema,
  ContentType,
  ContentVariantsSchema,
  FieldSchema,
  FieldTypeSchema,
  FieldValidatorSchema,
} from '../model';

const ZFieldTypeParamsSchema = z.record(
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
  name: z.string().superRefine(toZodRefinement(refValidator)),
  params: ZFieldTypeParamsSchema.optional(),
});

const ZValidatorSchema = z.object({
  name: z.string().superRefine(toZodRefinement(refValidator)),
  params: ZFieldTypeParamsSchema.optional(),
});

type FieldShape = {
  name: string;
  label?: string;
  description?: string;
  example?: string;
  type: string | z.infer<typeof ZFieldTypeSchema>;
  isList?: boolean;
  required?: boolean;
  validation?: Array<string | z.infer<typeof ZValidatorSchema>>;
  fields?: FieldShape[];
};

const ZFieldSchema: ZodType<FieldShape> = z.lazy(() =>
  z
    .object({
      name: z.string().superRefine(toZodRefinement(idValidator)),
      label: z.string().optional(),
      description: z.string().optional(),
      example: z.string().optional(),
      type: z.union([z.string().superRefine(toZodRefinement(refValidator)), ZFieldTypeSchema]),
      isList: z.boolean().default(false),
      required: z.boolean().default(false),
      validation: z.array(z.union([z.string(), ZValidatorSchema])).optional(),
      fields: z.array(ZFieldSchema).optional(),
    })
    .superRefine((data, ctx) => {
      const isGroup = data.type === 'group';

      if (isGroup && !data.fields) {
        ctx.addIssue({
          path: ['fields'],
          code: z.ZodIssueCode.custom,
          message: `'fields' must be present when type is 'group'`,
        });
      }

      if (!isGroup && data.fields) {
        ctx.addIssue({
          path: ['fields'],
          code: z.ZodIssueCode.custom,
          message: `'fields' must be omitted unless type is 'group'`,
        });
      }
    }),
);

const ZContentVariantsSchema = z.object({
  values: z.array(z.string()),
  default: z.string().optional(),
});

// TODO: extention mechanism for content sschema (presets)
export const ZContentSchema = z.object({
  name: z.string().superRefine(toZodRefinement(idValidator)),
  extends: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType),
  variants: z.union([z.array(z.string()), ZContentVariantsSchema]).optional(),
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
