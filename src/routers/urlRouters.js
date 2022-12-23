import { Router } from "express";
import { validateUrl } from "../middlewares/urlMiddleware.js";
import { urls, getUrls } from "../controllers/urlControllers.js";

const router = Router();

router.post("/urls/shorten", validateUrl, urls);

router.get("/urls/:id", getUrls);

export default router;
