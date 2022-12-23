import joi from "joi";

export const singUpSchema = joi.object({
    name: joi.string().min(1).required(),
    password: joi.string().min(1).required(),
    email: joi.string().email().min(1).required(),
    confirmPassword: joi.ref("password"),
  });
  
  export const singInSchema = joi.object({
    password: joi.string().min(1).required(),
    email: joi.string().email().min(1).required(),
  });