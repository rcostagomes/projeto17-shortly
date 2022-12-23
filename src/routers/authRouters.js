import { Router } from "express";
import {
  validateSingIn,
  validateSingUp,
} from "../middlewares/authMiddleware.js";
import { singIn, singUp } from "../controllers/authControllers.js";

const router = Router();

router.post("/singup", validateSingUp, singUp);

router.post("/singin", validateSingIn, singIn);

export default router;