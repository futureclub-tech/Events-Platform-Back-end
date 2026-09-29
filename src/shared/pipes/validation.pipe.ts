import { BadRequestException, ValidationPipe } from "@nestjs/common";

const CONSTRAINT_CODE_MAP: Record<string, string> = {
  isNotEmpty: "REQUIRED",
  isDefined: "REQUIRED",
  isLength: "INVALID_LENGTH",
  minLength: "INVALID_LENGTH",
  maxLength: "INVALID_LENGTH",
  isString: "INVALID_TYPE",
  isEmail: "INVALID_FORMAT",
  matches: "INVALID_FORMAT",
  isMobilePhone: "INVALID_FORMAT",
};

/**
 * Implemented a Custom Validation Pipe for filtering Inputs
 */
export const CustomValidationPipe = new ValidationPipe({
  exceptionFactory: errors => {
    const formattedErrors: Array<{
      field: string;
      code: string;
      message: string;
    }> = [];
    errors.forEach(err => {
      if (err.constraints) {
        const constraintKeys = Object.keys(err.constraints);
        const firstKey = constraintKeys[0] || "INVALID";
        const message = err.constraints[firstKey];
        let code = CONSTRAINT_CODE_MAP[firstKey] || firstKey.toUpperCase();

        formattedErrors.push({ code, field: err.property, message });
      }
    });
    return new BadRequestException({
      errors: formattedErrors,
      success: "false",
      messages: "VALIDATION_FAILED",
    });
  },
});
