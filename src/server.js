import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuidV4 } from "uuid";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const port = process.env.PORT || 4000;
const { Pool } = pkg;

const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const singUpSchema = joi.object({
  name: joi.string().min(1).required(),
  password: joi.string().min(1).required(),
  email: joi.string().email().min(1).required(),
});

const singInSchema = joi.object({
  password: joi.string().min(1).required(),
  email: joi.string().email().min(1).required(),
});

app.post("/singup", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const user = { name, password, email };

  if (password !== confirmPassword) {
    res.status(422).send({ message: "Senhas não correspondentes" });
  }

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
      return res.status(409).send("Email já cadastrado");
    }

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
});

app.post("/singin", async (req, res) => {
  const { email, password } = req.body;

  const user = {
    email,
    password,
  };
  const validation = singInSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }
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
});

app.listen(port, () => console.log(`app runing in port ${port}`));
