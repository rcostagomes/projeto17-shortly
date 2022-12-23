import { Router } from "express";
import { validateUrl } from "../middlewares/urlMiddleware.js";
import { urls, getUrls ,OpenShortUrl } from "../controllers/urlControllers.js";

const router = Router();

router.post("/urls/shorten", validateUrl, urls);

router.get("/urls/:id", getUrls);

router.get("/urls/open/:shortUrl",OpenShortUrl)

export default router;
