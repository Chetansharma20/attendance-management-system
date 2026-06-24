import express from "express";
import { getMyNotifications, markAsRead } from "./notification.controller.js";
import verifyJWT from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/my", getMyNotifications);
router.patch("/:id/read", markAsRead);

export default router;
