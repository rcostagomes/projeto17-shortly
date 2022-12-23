import express from "express";
import cors from "cors";
import joi from "joi";
import { nanoid } from "nanoid";
import connection from "./db.js";
import authRouters from "../routers/authRouters.js"
const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 4000;


const urlSchema = joi.object({
  url: joi.string().uri().required(),
});

app.use(authRouters)

app.post("/urls/shorten", async (req, res) => {
  const { authorization } = req.headers;
  const { url } = req.body;
  console.log(url);
  const validateToken = authorization?.replace("Bearer ", "");
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
    const link = shortUrlExist.rows[0].url;
    res.redirect(link);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.delete("/urls/:id", async (req, res) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  const validateToken = authorization?.replace("Bearer ", "");
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

app.get("/users/me", async (req, res) => {
  const { authorization } = req.headers;
  const validateToken = authorization?.replace("Bearer ", "");
  console.log(validateToken);
  if (!validateToken) {
    return res.status(401).send({ message: "Usuário sem autorização" });
  }
  try {
    const userId = await connection.query(
      `SELECT * FROM sessions WHERE token= $1`,
      [validateToken]
    );

    const userInfos = await connection.query(
      `SELECT * FROM users WHERE id = $1`,
      [userId.rows[0].userId]
    );

    const tableUrls = await connection.query(
      `SELECT * FROM urls WHERE "userId" =$1`,
      [userId.rows[0].userId]
    );

    if (!userId || !userInfos || !tableUrls) {
      return res.status(404).send({ message: "dados invalidos" });
    }
    console.log(tableUrls.rows);

    let visitCount = 0;
    tableUrls.rows.map((rows) => {
      console.log("visitCount", rows.visitCount);
      for (let i = 0; i < rows.visitCount; i++) {
        visitCount++;
      }
    });
    const me = {
      id: userInfos.rows[0].id,
      name: userInfos.rows[0].name,
      visitCount: visitCount,
      shortenedUrls: tableUrls.rows,
    };
    console.log(me);
    console.log(visitCount);
    res.status(200).send(me);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.listen(port, () => console.log(`app runing in port ${port}`));
