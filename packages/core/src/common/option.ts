export type Option<T> = Some<T> | None;

export interface Some<T> {
  readonly _tag: 'Some';
  readonly value: T;
}

export interface None {
  readonly _tag: 'None';
}

export const Option = {
  some: <T>(value: T): Option<T> => ({ _tag: 'Some', value }),
  none: (): Option<never> => ({ _tag: 'None' }),

  fromNullable: <T>(val: T | null | undefined): Option<T> =>
    val != null ? Option.some(val) : Option.none(),

  getOrElse: <T>(opt: Option<T>, fallback: T): T => (opt._tag === 'Some' ? opt.value : fallback),

  isSome: <T>(opt: Option<T>): opt is Some<T> => opt._tag === 'Some',
  isNone: <T>(opt: Option<T>): opt is None => opt._tag === 'None',
};
