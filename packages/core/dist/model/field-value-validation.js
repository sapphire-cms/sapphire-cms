export function parametrizedFieldValidatorFactory(validatorName, forTypes, params, valueValidatorFactory) {
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