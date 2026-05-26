import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware";
import { approveNurse, getPendingNurses, createService, updateService } from "../controllers/admin.controllers";

const router = Router();

// Apply JWT and Role checks to all admin routes
router.use(verifyJWT);
router.use(authorizeRoles("admin", "super_admin"));

router.route("/nurses/pending").get(getPendingNurses);
router.route("/nurses/:id/approve").patch(approveNurse);
router.route("/services").post(createService);
router.route("/services/:id").patch(updateService);

export default router;
