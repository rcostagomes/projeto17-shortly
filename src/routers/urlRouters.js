import { Router } from "express";
import { validateUrl } from "../middlewares/urlMiddleware.js";
import { urls, getUrls ,OpenShortUrl,deleteUrl } from "../controllers/urlControllers.js";

const router = Router();

router.post("/urls/shorten", validateUrl, urls);

router.get("/urls/:id", getUrls);

router.get("/urls/open/:shortUrl",OpenShortUrl)

router.delete("/urls/:id",deleteUrl)

export default router;
