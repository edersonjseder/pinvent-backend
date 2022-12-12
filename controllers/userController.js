import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Token from "../models/tokenModel.js";
import generateToken from "../utils/generateToken.js";
import verifyToken from "../utils/tokenVerify.js";
import emailMessage from "../utils/emailMessage.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// @desc Register new user
// @route POST /api/users
// @access Public
export const registerUser = asyncHandler(async (req, res) => {
  const { email, password, confirmPassword, name, phone, bio } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords don't match");
  }

  const user = await User.create({
    email,
    password,
    name,
    phone,
    bio,
  });

  const token = generateToken(user._id);

  // Send HTTP-Only cookie
  res.cookie("token", token, {
    path: "/", // Path where cookie will be stored
    httpOnly: true, // This parameter flags the cookie to be only used by web server
    expires: new Date(Date.now() + 1000 * 86400), // expiry time of the cookie, here is 1 day
    sameSite: "none", // Frontend and backend can have different URLs, so it will work the anyway
    secure: true, // Marks the cookie to be used only with https
  });

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc Update user
// @route PATCH /api/users/update
// @access Private
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Update user password
// @route PATCH /api/users/changepassword
// @access Private
export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { oldPassword, password, confirmPassword } = req.body;

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please fill in old password and new password");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords don't match");
  }

  if (user && (await user.matchPassword(oldPassword))) {
    user.password = password;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

// @desc Forgot Password
// @route POST /api/users/forgotpassword
// @access Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Delete token if it exists in db associated with user
  let token = await Token.findOne({ userId: user._id });

  if (token) {
    await Token.deleteOne();
  }

  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);
  // Hash the token before save it to db
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save token to db
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // 30 minutes
  }).save();

  // Construct Reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Construct Reset email
  const { subject, sendTo, sentFrom, message } = emailMessage(user, resetUrl);

  try {
    await sendEmail(subject, message, sendTo, sentFrom);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// @desc Reset Password
// @route PUT /api/users/resetpassword
// @access Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash the token then compare it to token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Find token in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Token invalid or expired");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;

  await user.save();

  res.status(200).json({ message: "Password Reset Successfully" });
});

// @desc Login & Auth user & get token
// @route POST /api/users/login
// @access Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  const pswIsCorrect = await user.matchPassword(password);

  // Generate token
  const token = generateToken(user._id);

  // Send HTTP-Only cookie
  res.cookie("token", token, {
    path: "/", // Path where cookie will be stored
    httpOnly: true, // This parameter flags the cookie to be only used by web server
    expires: new Date(Date.now() + 1000 * 86400), // expiry time of the cookie, here is 1 day
    sameSite: "none", // Frontend and backend can have different URLs, so it will work the anyway
    secure: true, // Marks the cookie to be used only with https
  });

  if (user && pswIsCorrect) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user credentials");
  }
});

// @desc Logout user
// @route GET /api/users/logout
// @access Public
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/", // Path where cookie will be stored
    httpOnly: true, // This parameter flags the cookie to be only used by web server
    expires: new Date(0), // expity time of the cookie, here we are expiring it early
    sameSite: "none", // Frontend and backend can have different URLs, so it will work the anyway
    secure: true, // Marks the cookie to be used only with https
  });
  //   res.clearCookie("token");
  return res.status(200).json({
    message: "Successfully logged out",
  });
});

// @desc get user profile
// @route GET /api/users/profile
// @access Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc get user status
// @route GET /api/users/loggedin
// @access Public
export const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json(false);
  }

  // Verify token
  const verified = verifyToken(token);

  if (verified) {
    return res.json(true);
  }

  return res.json(false);
});
