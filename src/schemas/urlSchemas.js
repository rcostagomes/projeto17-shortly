import joi from "joi";

export const urlSchemas = joi.object({
    url: joi.string().uri().required(),
  });