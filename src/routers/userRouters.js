import { Router } from "express";
import { getRanking, userMe } from "../controllers/userControllers.js";
const router = Router();

router.get("/users/me", userMe);
router.get("/ranking",getRanking)
export default router;
