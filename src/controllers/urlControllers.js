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