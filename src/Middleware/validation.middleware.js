import { GenderEnum } from "../Utils/enums/user.enum.js";
import { BadRequestException } from "../Utils/response/error.response.js";
import joi from "joi";
import mongoose from "mongoose";

export function validation(schema) {
  return (req, res, next) => {
    const validationErrors = [];

    for (const schemaKey of Object.keys(schema)) {
      const validateResult = schema[schemaKey].validate(req[schemaKey], {
        abortEarly: false,
      });

      req["v" + schemaKey] = validateResult.value;

      if (validateResult.error?.details?.length > 0) {
        validationErrors.push(...validateResult.error.details);
      }
    }

    if (validationErrors.length > 0) {
      throw BadRequestException("Validation error.", validationErrors);
    }

    next();
  };
}

export const CommonFieldValidations = {
  firstName: joi.string().pattern(new RegExp(/^[A-Z]{1}[a-z]{1,24}$/)),
  lastName: joi.string().pattern(new RegExp(/^[A-Z]{1}[a-z]{1,24}$/)),
  email: joi
    .string()
    .pattern(
      new RegExp(
        /^\w{3,25}@(gmail|yahoo|outlook|icloud)(.com|.net|.co|.eg){1,4}$/,
      ),
    )
    .trim(),
  password: joi
    .string()
    .pattern(
      new RegExp(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,16}/),
    ),
  confirmPassword: joi.string().valid(joi.ref("password")),
  phone: joi.string().pattern(new RegExp(/^(\+201|00201|01)(0|1|2|5)\d{8}$/)),
  DOB: joi.date(),
  gender: joi.string().valid(...Object.values(GenderEnum)),
};

export function validateObjectIdFn(value, helpers) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("invalid object id format");
  }
}
