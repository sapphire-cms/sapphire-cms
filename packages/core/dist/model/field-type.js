export function parametrizedFieldTypeFactory(name, castTo, paramDefs, typeValidatorFactory) {
    return (params) => {
        // TODO: validate typeParams against paramDefs
        // TODO: cache types that doesn't need parametrization
        return {
            name,
            castTo,
            params,
            isValueOfType: typeValidatorFactory(params), // TODO: wrap this validator, need to cast value first
        };
    };
}
export function simpleFieldTypeFactory(name, castTo, typeValidator) {
    return parametrizedFieldTypeFactory(name, castTo, [], (params) => typeValidator);
}
//# sourceMappingURL=field-type.js.map