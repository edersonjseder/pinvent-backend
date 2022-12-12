import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import verifyToken from "../utils/tokenVerify.js";

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    // Verify token
    const verified = verifyToken(token);

    // Get user id from token
    req.user = await User.findById(verified.id).select("-password");

    next();
  } catch (error) {
    console.error(error);
    res.status(401);
    throw new Error("Not authorized");
  }
});

export { protect };
