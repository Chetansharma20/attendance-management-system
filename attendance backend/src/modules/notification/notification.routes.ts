import express from "express";
import { getMyNotifications, markAsRead, deleteNotification, clearAllNotifications } from "./notification.controller.js";
import verifyJWT from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/my", getMyNotifications);
router.delete("/my/all", clearAllNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
