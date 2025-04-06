export type TextFormFieldTypes = {
  string: string;
  number: number;
  boolean: boolean;
};

export type TextFormFieldCommentBlock = {

  /** By default is a field name */
  label?: string;

  /** By default is false. */
  isRequired?: boolean;

  /** By default the same as field type. */
  declaredType?: string;

  description?: string;
  example?: string;
  notes?: string[];
  errors?: string[];
};

export type TextFormField<
    TType extends keyof TextFormFieldTypes = keyof TextFormFieldTypes,
    TValue extends TextFormFieldTypes[TType] = TextFormFieldTypes[TType]
> = {
  name: string;
  type: TType;
  values?: TValue[]; // always treated as array (multi-entry or single-entry)
  commentBlock?: TextFormFieldCommentBlock;
};

export type TextForm = {
  banner: string;
  fields: TextFormField[];
};

export type TextFormCollected<T extends TextForm = TextForm> = {
  [F in T['fields'][number] as F['name']]: F extends TextFormField<
          infer TypeKey,
          infer Value
      >
      ? Value[]
      : never;
};
