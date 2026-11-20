const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const role = adminEmails.includes(email.toLowerCase()) ? "admin" : "user";

    const user = await User.create({ name, email, password, role });
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ message: "Account disabled by admin" });
    user.lastLoginAt = new Date();
    await user.save();
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
};

exports.me = (req, res) => res.json({ user: req.user });

exports.logout = (req, res) => res.json({ message: "Logged out" });

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, profile } = req.body;
    if (name) req.user.name = name;
    if (profile) req.user.profile = { ...req.user.profile?.toObject?.(), ...profile };
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};
