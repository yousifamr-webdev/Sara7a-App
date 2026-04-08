import joi from "joi";
import { CommonFieldValidations } from "../../Middleware/validation.middleware.js";

export const sendMessageSchema = {
  body: joi.object({}).keys({
    content: joi.string().min(3).max(1000),
  }),
  params: joi
    .object({})
    .keys({
      receiverId: CommonFieldValidations.id.required(),
    })
    .required(),
};

export const getMessageByIdSchema = {
  params: joi
    .object({})
    .keys({
      messageId: CommonFieldValidations.id.required(),
    })
    .required(),
};