export function parametrizedFieldValidatorFactory(validatorName, forTypes, // null means validator can be applied to the field of all types
params, valueValidatorFactory) {
    return (params) => {
        // TODO: validate typeParams against paramDefs
        return {
            name: validatorName,
            forTypes,
            params,
            validate: valueValidatorFactory(params),
        };
    };
}
//# sourceMappingURL=field-value-validation.js.map