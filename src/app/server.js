import express from "express";
import cors from "cors";
import connection from "./db.js";
import authRouters from "../routers/authRouters.js"
import urlRouters from "../routers/urlRouters.js"
const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 4000;




app.use(authRouters)

app.use(urlRouters)


app.get("/urls/open/:shortUrl", async (req, res) => {
  
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
