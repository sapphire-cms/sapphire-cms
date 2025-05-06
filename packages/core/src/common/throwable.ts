export abstract class Throwable extends Error {
  public abstract _tag: string;

  protected constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}

type ErrorMatcher<T> = {
  [K in Throwable['_tag']]?: (err: Extract<Throwable, { _tag: K }>) => T;
} & {
  _: (err: Throwable) => T; // fallback
};

export function matchError<T>(err: Throwable, matcher: ErrorMatcher<T>): T {
  const handler = matcher[err._tag as keyof typeof matcher] as ((e: Throwable) => T) | undefined;
  return handler ? handler(err) : matcher._(err);
}
