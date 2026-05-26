import { Router } from "express";
import { getNearbyNurses } from "../controllers/nurse.controllers";

const router = Router();

router.route("/nearby").get(getNearbyNurses);

export default router;
