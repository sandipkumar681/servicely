import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { requestBooking, updateBookingStatus, cancelBooking } from "../controllers/booking.controllers";

const router = Router();

// Apply JWT verification to all booking routes
router.use(verifyJWT);

router.route("/request").post(requestBooking);
router.route("/:id/status").patch(updateBookingStatus);
router.route("/:id/cancel").patch(cancelBooking);

export default router;
