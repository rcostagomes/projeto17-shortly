import connection from "../app/db.js";
import { v4 as uuidV4 } from "uuid";
import bcrypt from "bcrypt";

export async function singUp(req, res) {
  const { name, email, password } = req.body;

  try {
    const encryptPassword = bcrypt.hashSync(password, 10);

    await connection.query(
      `INSERT INTO users (name,email,password) VALUES ($1,$2,$3)`,
      [name, email, encryptPassword]
    );

    res.status(201).send({ message: "Usuário Cadastrado" });
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
}

export async function singIn(req, res) {
  const { email, password } = req.body;
  try {
    const emailExist = await connection.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    console.log(emailExist.rows[0].password);
    const validatePassword = bcrypt.compareSync(
      password,
      emailExist.rows[0].password
    );

    if (!emailExist.rows[0] || !validatePassword) {
      return res.status(401).send({ message: "Dados Invalidos" });
    }

    console.log(emailExist.rows[0].id);
    const token = uuidV4();
    await connection.query(
      `INSERT INTO sessions (token, "userId") VALUES ($1,$2)`,
      [token, emailExist.rows[0].id]
    );

    res.status(200).send(token);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
}
