import { Router } from "express";
import { signUpUser } from "../controllers/user.controllers";
const router = Router();

router.route("/signup").get(signUpUser);

export default router;
