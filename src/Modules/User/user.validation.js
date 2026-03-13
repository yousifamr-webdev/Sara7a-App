import joi from "joi";

export const profilePicSchema = {
  file: joi
    .object({})
    .keys({
      fieldname: joi.string().required(),
      originalname: joi.string().required(),
      encoding: joi.string().required(),
      mimetype: joi.string().required(),
      finalPath: joi.string().required(),
      destination: joi.string().required(),
      filename: joi.string().required(),
      path: joi.string().required(),
      size: joi.number().required(),
    })
    .required(),
};

export const coverPicSchema = {
  files: joi
    .array()
    .items(
      joi
        .object({})
        .keys({
          fieldname: joi.string().required(),
          originalname: joi.string().required(),
          encoding: joi.string().required(),
          mimetype: joi.string().required(),
          finalPath: joi.string().required(),
          destination: joi.string().required(),
          filename: joi.string().required(),
          path: joi.string().required(),
          size: joi.number().required(),
        })
        .required(),
    )
    .required(),
};
