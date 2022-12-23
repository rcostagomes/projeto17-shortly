import { Router } from "express";
import { validateUrl } from "../middlewares/urlMiddleware.js";
import { urls } from "../controllers/urlControllers.js";

const router = Router();

router.post("/urls/shorten", validateUrl, urls);


export default router;