import { Router } from "express";
import { sendOTPs } from "../controllers/sendOTPs.controllers";
const router = Router();

router.route("/send-otps").post(sendOTPs);

export default router;
