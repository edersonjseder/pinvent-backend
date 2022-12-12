import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserProfile,
  loginStatus,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/register").post(registerUser);
router.post("/login", loginUser);
router.route("/logout").get(logoutUser);
router.get("/profile", protect, getUserProfile);
router.get("/loggedin", loginStatus);
router.patch("/update", protect, updateUser);
router.patch("/changepassword", protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

export default router;
