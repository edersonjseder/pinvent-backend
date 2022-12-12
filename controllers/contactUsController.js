import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";

// @desc Contact Us
// @route POST /api/contact
// @access Private
export const contactUs = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Validation
  if (!subject || !message) {
    res.status(400);
    throw new Error("Subject and message are required");
  }

  const sendTo = process.env.EMAIL_USER_GMAIL;
  const sentFrom = user.email;
  const replyTo = user.email;

  // Send email
  try {
    await sendEmail(subject, message, sendTo, sentFrom, replyTo);
    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});
