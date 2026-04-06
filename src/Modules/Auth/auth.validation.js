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

export const confirmEmailSchema = {
  body: joi
    .object()
    .keys({
      email: CommonFieldValidations.email.required(),
      otp: CommonFieldValidations.OTP.required(),
    })
    .required(),
};

export const confirmTwoStepLoginSchema = {
  body: joi
    .object()
    .keys({
      email: CommonFieldValidations.email.required(),
      otp: CommonFieldValidations.OTP.required(),
    })
    .required(),
};

export const confirmEmailResendOtpSchema = {
  body: joi
    .object()
    .keys({
      email: CommonFieldValidations.email.required(),
    })
    .required(),
};

export const forgetPasswordOtpSchema = {
  body: joi
    .object()
    .keys({
      email: CommonFieldValidations.email.required(),
    })
    .required(),
};

export const verifyForgetPasswordOtpSchema = {
  body: joi
    .object()
    .keys({
      email: CommonFieldValidations.email.required(),
      otp: CommonFieldValidations.OTP.required(),
    })
    .required(),
};

export const resetPasswordOtpSchema = {
  body: joi
    .object()
    .keys({
      email: CommonFieldValidations.email.required(),
      otp: CommonFieldValidations.OTP.required(),
      password: CommonFieldValidations.password.required(),
    })
    .required(),
};

export const updatePasswordSchema = {
  body: joi
    .object()
    .keys({
      oldPassword: CommonFieldValidations.password.required(),
      newPassword: CommonFieldValidations.password.required(),
      confirmNewPassword: joi.string().valid(joi.ref("newPassword")).required(),
    })
    .required(),
};

export const confirmTwoStepVerificationSchema = {
  body: joi
    .object()
    .keys({
      otp: CommonFieldValidations.OTP.required(),
    })
    .required(),
};