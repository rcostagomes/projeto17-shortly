import connection from "../app/db.js";
import { nanoid } from "nanoid";


export async function urls(req,res){
    const { authorization } = req.headers;
    const { url } = req.body;
    console.log(url);
    const validateToken = authorization?.replace("Bearer ", "");
    if (!validateToken) {
      return res.status(401).send({ message: "Usuário sem autorização" });
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
}

export async function getUrls(req,res){
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
}

export async function OpenShortUrl(req,res){
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
}