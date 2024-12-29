import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSuggestedConnnections, getPublicProfile, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/suggestions", protectRoute, getSuggestedConnnections);
router.get("/:username", protectRoute, getPublicProfile);

router.put("/profile", protectRoute, updateProfile)


export default router;