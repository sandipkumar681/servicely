import { Router } from "express";
import { getActiveServices } from "../controllers/service.controllers";

const router = Router();

router.route("/").get(getActiveServices);

export default router;
