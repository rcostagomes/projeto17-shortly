import { urlSchemas } from "../schemas/urlSchemas.js";

export async function validateUrl(req, res, next) {
  const urlSchema = req.body;

  const validation = urlSchemas.validate(urlSchema, { abortEarly: false });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }

  next();
}
