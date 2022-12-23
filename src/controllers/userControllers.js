import connection from "../db.js";

export async function userMe(req, res) {
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

    res.status(200).send(me);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
}

export async function getRanking(req, res) {
  try {
    const getRanking = await connection.query(`
        SELECT users.id, users.name, COUNT(urls."shortUrl") AS "linksCount", SUM(urls."visitCount") AS "visitCount"
    FROM users LEFT JOIN urls 
    ON users.id = urls."userId" 
    GROUP BY users.id ORDER BY "visitCount" DESC
    LIMIT 10;
        `);

    const rankingList = getRanking.rows.reverse();
    res.status(200).send(rankingList);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
}
