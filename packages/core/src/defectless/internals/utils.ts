import { Outcome } from '../outcome';
import { err, ok, Result } from '../result';

// Given a list of Results, this extracts all the different `T` types from that list
export type ExtractOkTypes<T extends readonly Result<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends Result<infer U, unknown> ? U : never;
};

// Given a list of ResultAsyncs, this extracts all the different `T` types from that list
export type ExtractOkAsyncTypes<T extends readonly Outcome<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends Outcome<infer U, unknown> ? U : never;
};

// Given a list of Results, this extracts all the different `E` types from that list
export type ExtractErrTypes<T extends readonly Result<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends Result<unknown, infer E> ? E : never;
};

// Given a list of ResultAsyncs, this extracts all the different `E` types from that list
export type ExtractErrAsyncTypes<T extends readonly Outcome<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends Outcome<unknown, infer E> ? E : never;
};

export type InferOkTypes<R> = R extends Result<infer T, unknown> ? T : never;
export type InferErrTypes<R> = R extends Result<unknown, infer E> ? E : never;

export type InferAsyncOkTypes<R> = R extends Outcome<infer T, unknown> ? T : never;
export type InferAsyncErrTypes<R> = R extends Outcome<unknown, infer E> ? E : never;

/**
 * Short circuits on the FIRST Err value that we find
 */
export const combineResultList = <T, E>(
  resultList: readonly Result<T, E>[],
): Result<readonly T[], E> => {
  let acc = ok([]) as Result<T[], E>;

  for (const result of resultList) {
    if (result.isErr()) {
      acc = err(result.error);
      break;
    } else {
      acc.map((list) => list.push(result.value));
    }
  }
  return acc;
};

/**
 * Give a list of all the errors we find
 */
export const combineResultListWithAllErrors = <T, E>(
  resultList: readonly Result<T, E>[],
): Result<readonly T[], E[]> => {
  let acc = ok([]) as Result<T[], E[]>;

  for (const result of resultList) {
    if (result.isErr() && acc.isErr()) {
      acc.error.push(result.error);
    } else if (result.isErr() && acc.isOk()) {
      acc = err([result.error]);
    } else if (result.isOk() && acc.isOk()) {
      acc.value.push(result.value);
    }
    // do nothing when result.isOk() && acc.isErr()
  }
  return acc;
};
