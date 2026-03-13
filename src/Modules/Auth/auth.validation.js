import joi from "joi";
import { CommonFieldValidations } from "../../Middleware/validation.middleware.js";

export const loginSchema = {
  query: joi.object({}).keys({
    ln: joi.string().valid("en", "ar", "fr").required(),
  }),
  body: joi
    .object({})
    .keys({
      email: CommonFieldValidations.email.required(),
      password: CommonFieldValidations.password.required(),
    })
    .required(),
};

export const signupSchema = {
  query: joi.object({}).keys({
    ln: joi.string().valid("en", "ar", "fr").required(),
  }),
  body: joi
    .object({})
    .keys({
      firstName: CommonFieldValidations.firstName.required(),
      lastName: CommonFieldValidations.lastName.required(),
      email: CommonFieldValidations.email.required(),
      password: CommonFieldValidations.password.required(),
      confirmPassword: CommonFieldValidations.confirmPassword.required(),
      phone: CommonFieldValidations.phone.required(),
      DOB: CommonFieldValidations.DOB.required(),
      gender: CommonFieldValidations.gender.required(),
    })
    .required(),
};
