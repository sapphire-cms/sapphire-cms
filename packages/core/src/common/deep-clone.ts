/**
 * Primitive deep clone utility designed to make a copy of structured objects. This function is not designed to clone
 * instances of classes, of any kind of objects with functions as fields.
 *
 * @param obj object to clone
 * @return deep copy of the object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
