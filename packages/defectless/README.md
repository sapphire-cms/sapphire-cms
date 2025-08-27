<div align="center">
    <img src="./docs/logo.png" style="width: 200px;" />
    <p><code>MAKING TYPESCRIPT CODE SAFE, PREDICTABLE AND RELIABLE</code></p>
</div>

[![npm](https://img.shields.io/npm/v/defectless.svg)](http://npm.im/defectless)
![npm bundle size](https://img.shields.io/bundlephobia/min/defectless)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/defectless)

`defectless` is a library for writing safe and predictable programs in Typescript - without surprises,
silent failures, or hidden bugs.
It helps developers model both success and failure clearly, and catch everything that could go wrong.

`defectless` is perfect for complex applications with multiple points of failure that rely heavily on `Promises`.

It’s primarily about types and conventions: no runtime dependencies, only a tiny footprint (~6 KB), and in return you
get an unparalleled level of correctness and safety.

Written in pure, environment-agnostic TypeScript, `defectless` runs anywhere JavaScript does: Node, Browser, Deno, Bun,
serverless platforms, edge runtimes, even embedded devices.

# Why defectless?

- A simple concept: _a Promise with a typed error channel_.
- No complicated functional programming: just clear, explicit flows.
- Native to TypeScript/JavaScript: built for real-world TS apps, not a port of Rust or Haskell ideas.
- Seamless sync + async composition: no explicit conversions - perfect for the JavaScript world where both coexist.
- Bulletproof safety, without heavy runtime.
- Lightweight DX and simple learning curve.

# Philosophy

`defectless` is a framework for correctness. It enables developers to write complex programs without overlooking a
single pitfall. It is designed for both **synchronous** and **asynchronous** code, and both types of flows can be
seamlessly composed.

To achieve this goal, `defectless` follows these principles:

### 1. Uncompromising syntax

That may look verbose and intimidating at first, but leaves no room for mistake.

### 2. No Shortcuts in Error Handling

`defectless` doen't allow to ignore, swallow or hide rising errors. Every posible outcome should be handled explicitly.

### 3. Unified Composition of Sync and Async Flows

`defectless` makes it easy to compose both synchronous and asynchronous logic in the same flow.

### 4. Async by Default

All flows in `defectless` are asynchronous, unless declared synchronous explicitly. The first asynchronous operation
in the flow automatically escalate the flow to asynchronous mode.

### 5. No Error Goes Unnoticed

Every error - whether anticipated or unexpected - is caught and channeled through the system.
No swallowed exceptions. No `try/catch` black holes.
`defectless` makes error surfaces visible and typed.

### 6. Defects Must Surface

`defectless` separates failures from bugs. Unanticipated or uncatchable failures are classified as defects -
and they will manifest at the terminal operation.

# Outcomes

`defectless` revolves around objects called **Outcomes**. An Outcome represents the result of code execution - either
a success or a failure. You can think of Outcomes as _"Promises with a typed error channel."_

```typescript
// API with Promise; only success values are typed
function readTextFile(filename: string): Promise<string>;

// API with Outcome; both success and failures are typed
function readTextFile(filename: string): Outcome<string, FsError>;
```

While `Outcome` is not a subclass of `PromiseLike` and cannot be directly used with `async/await`,
it offers very similar semantics.

There are two kinds of Outcomes in `defectless`: `AsyncOutcome` and `SyncOutcome`.
They compose seamlessly together, and most of the time no explicit conversion is needed.

Asynchronous flows are the default in `defectless`, because most real-world applications rely on asynchronous calls
to external systems - such as file system operations, service requests, or background workers.

`SyncOutcome` is a special case representing the result of purely synchronous execution.
It must be declared explicitly. If any asynchronous operation appears in a synchronous flow,
the entire flow automatically escalates to asynchronous mode.

Outcomes expose a rich set of functional methods for transforming values and errors, performing side effects,
recovering from failures, and finalizing flows.

And while functional programming is powerful, the real magic of `Promise`s often comes from `async/await`,
which lets developers write asynchronous code in a pseudo-linear style.
`defectless` provides a very similar mechanism: you can compose Outcomes in a pseudo-linear manner using
**generator functions**. This allows developers to write clear, procedural-looking code while still benefiting
from the robust failure handling provided by `defectless`.

In addition to anticipated and expected failures, `defectless` also catches every error thrown within the
flows it manages. These errors are classified as **defects** - in other words,
actual bugs in your software.
Defects are preserved and resurface at the end of the flow, when the `Outcome` is unwrapped.

## Introducing defectless into your code

`defectless` is a **progressive library**. This means you can migrate only the parts of your code that require
particular care, instead of rewriting everything at once.

That said, it’s usually best to transform flows into `defectless` flows **end to end**.
To achieve this, Outcomes should be **wrapped and unwrapped at the edges** of your application.

The _edges_ are the boundaries where your application interacts with external systems - for example:

- calls to the operating system or file system,
- database queries,
- usage of third-party libraries,
- handling of HTTP requests.

**Rule of thumb**: wrap every call to code you don’t control into an `Outcome`,
and unwrap only when you need to return results to an external consumer
(console output, database write, HTTP response, etc.).
Inside your application, work directly with `Outcome`s.

### Example

Wrapping a risky method like `fs.readFile` into an `Outcome`:

```typescript
// Wrap invocation of fs.readFile into an Outcome
export function readTextFile(filename: string): Outcome<string, FsError> {
  return Outcome.fromSupplier(
    () => fs.readFile(filename, 'utf-8'),
    (err) => new FsError(`Failed to read file ${filename}`, err),
  );
}
```

Unwrapping an `Outcome` only at the boundary, before writing to console:

```typescript
// listDocuments returns Outcome<Document[], SomeError>
// It needs to be unwrapped before printing to console
await listDocuments(store).match(
  (documents) => console.log(documents),
  (err) => console.error(err),
  (defect) => console.error(defect),
);
```

### General Advices

To get the most out of `defectless`, follow these simple rules:

- Wrap and unwrap `Outcome`s **only at the edges** of your application.
- **Wrap risky** system calls or throwing methods from libraries, so the entire data flow remains safe.
- Use `SyncOutcome` only when necessary to emphasize that an **operation is purely synchronous**.
  Otherwise, prefer the generic `Outcome`.
- **Never return** `null` or `undefined` from a method returning an `Outcome`. Instead, return `success()` with no value.
- **Never use** `throw` inside your code - model errors as failures instead.
- `Outcome`s represent **results, not inputs**. Don’t pass them as function parameters; return them from operations.
- Leverage defects for bug reporting - every defect represents **an actual bug** in your program.

## Acknowledgment

`defectless` began as a fork and extensive rework of [neverthrow](https://github.com/supermacro/neverthrow).
Although none of the original `neverthrow` code remains, we are deeply grateful to
[@supermacro](https://github.com/supermacro) and [m-shaka](https://github.com/m-shaka)
for maintaining `neverthrow` over the years.
Without their contributions, `defectless` would not exist.

## Licence

This repository is licensed under the [MIT](LICENSE).
