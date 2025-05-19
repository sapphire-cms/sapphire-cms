// TODO: write test for isPromiseLike
/**
 * isPromiseLike(Promise.resolve(42)); // ✅ true
 * isPromiseLike({ then: () => {} });  // ✅ true
 * isPromiseLike(42);                  // ❌ false
 * isPromiseLike(null);                // ❌ false
 * isPromiseLike(undefined);           // ❌ false
 */
