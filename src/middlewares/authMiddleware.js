import connection from "../db.js";
import { singInSchema, singUpSchema } from "../schemas/authSchemas.js";

export async function validateSingUp(req, res, next) {
  const { email } = req.body;
  const user = req.body;

  const validation = singUpSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }

  try {
    const emailExist = await connection.query(
      `SELECT email FROM users WHERE email=$1`,
      [email]
    );
    if (emailExist.rows[0]) {
      return res.status(409).send({ message: "Email já cadastrado" });
    }
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }

  next();
}

export async function validateSingIn(req, res, next) {
  const user = req.body;

  const validation = singInSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }

  next();
}
