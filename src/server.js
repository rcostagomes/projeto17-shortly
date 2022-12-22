import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuidV4 } from "uuid";
import { nanoid } from "nanoid";
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

const urlSchema = joi.object({
  url: joi.string().uri().required(),
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
      return res.status(409).send({ message: "Email já cadastrado" });
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

app.post("/urls/shorten", async (req, res) => {
  const { authorization } = req.headers;
  const { url } = req.body;
  console.log(url);
  const validateToken = authorization?.replace("bearer ", "");
  if (!validateToken) {
    return res.status(401).send({ message: "Usuário sem autorização" });
  }
  console.log(validateToken);
  const validateUrl = {
    url,
  };
  const validation = urlSchema.validate(validateUrl, { abortEarly: false });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }

  try {
    const urlExist = await connection.query(
      `SELECT * FROM urls WHERE url= $1`,
      [url]
    );
    if (urlExist.rows[0]) {
      res.status(409).send({ message: "Url já existente" });
    }

    const userId = await connection.query(
      `SELECT * FROM sessions WHERE token= $1`,
      [validateToken]
    );
    console.log("userId", userId.rows[0].userId);
    const shortUrl = nanoid(10);
    console.log(shortUrl);
    await connection.query(
      `INSERT INTO urls (url, "shortUrl", "userId") VALUES ($1,$2,$3)`,
      [url, shortUrl, userId.rows[0].userId]
    );

    res.status(201).send({ shortUrl: shortUrl });
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.get("/urls/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const idExist = await connection.query(`SELECT * FROM urls WHERE id=$1`, [
      id,
    ]);
    if (!idExist.rows[0]) {
      return res.status(404).send({ message: "Id não encontrado" });
    }
    console.log(idExist.rows);

    const getUrls = {
      id: idExist.rows[0].id,
      shortUrl: idExist.rows[0].shortUrl,
      url: idExist.rows[0].url,
    };
    console.log(getUrls);

    res.status(200).send(getUrls);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.get("/urls/open/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;

  if (!shortUrl) {
    res.status(404).send({ message: "Insira a shortUrl" });
  }

  try {
    const shortUrlExist = await connection.query(
      `SELECT * FROM urls WHERE "shortUrl"=$1`,
      [shortUrl]
    );

    if (!shortUrlExist.rows[0]) {
      res.status(404).send({ message: "ShortUrl não encontrada" });
    }

    await connection.query(
      `UPDATE urls SET "visitCount" = "visitCount" + 1 WHERE "shortUrl" =$1`,
      [shortUrl]
    );
    console.log(shortUrlExist.rows[0].url);

    res.redirect(shortUrlExist.rows[0].url);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.delete("/urls/:id", async (req, res) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  const validateToken = authorization?.replace("bearer ", "");
  if (!validateToken) {
    return res.status(401).send({ message: "Usuário sem autorização" });
  }
  try {
    const userById = await connection.query(`SELECT * FROM urls WHERE id=$1`, [
      id,
    ]);
    const userByToken = await connection.query(
      `SELECT * FROM sessions  WHERE token = $1`,
      [validateToken]
    );

    if (!userById.rows[0]) {
      return res.status(404).send({ message: "Url não encontrada" });
    }
    if (!userByToken.rows[0]) {
      return res.status(404).send({ message: "Token invalido" });
    }
    console.log(userByToken.rows[0].userId);
    console.log(userById.rows[0].userId);
    if (userById.rows[0].userId !== userByToken.rows[0].userId) {
      return res
        .status(401)
        .send({ message: "Token incompativel com usuário" });
    }

     await connection.query(`DELETE FROM urls WHERE id= $1`, [id]);

    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.listen(port, () => console.log(`app runing in port ${port}`));
