import express from "express";
import cors from "cors";
import authRouters from "../routers/authRouters.js";
import urlRouters from "../routers/urlRouters.js";
import userRouters from "../routers/userRouters.js";

const app = express();
app.use(express.json());
app.use(cors());

app.use(authRouters);

app.use(urlRouters);

app.use(userRouters);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`app runing in port ${port}`));
