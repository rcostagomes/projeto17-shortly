import { Router } from "express";
import { userMe } from "../controllers/userControllers.js";
const router = Router();

router.get("/users/me", userMe);

export default router;
