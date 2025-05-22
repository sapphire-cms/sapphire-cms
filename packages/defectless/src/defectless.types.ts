import { Outcome } from './outcome';
import { OutcomeState } from './outcome-state';

// Given a list of Outcomes, this extracts all the different `T` types from that list
export type ExtractResultTypes<T extends readonly Outcome<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends Outcome<infer U, unknown> ? U : never;
};

export type ExtractFailureTypesOptional<T extends readonly Outcome<unknown, unknown>[]> = {
  [K in keyof T]: T[K] extends Outcome<unknown, infer E> ? E | undefined : never;
};

export type InferResultTypes<R> = R extends Outcome<infer T, unknown> ? T : never;
export type InferFailureTypes<R> = R extends Outcome<unknown, infer E> ? E : never;

// Given a list of Outcomes, this extracts all typed Promises from that list
export type CombinedPromises<T extends readonly Outcome<unknown, unknown>[]> = {
  [K in keyof T]: Promise<
    OutcomeState<
      T[K] extends Outcome<infer R, unknown> ? R : never,
      T[K] extends Outcome<unknown, infer E> ? E : never
    >
  >;
};
