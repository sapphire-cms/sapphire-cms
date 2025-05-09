# Defectless

`defectless` is a library for writing safe and predictable programs in TypeScript — without surprises,
silent failures, or hidden bugs.
It helps developers model both success and failure clearly, and catch everything that could go wrong.

To achieve that, `defectless` follows these principles:

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
