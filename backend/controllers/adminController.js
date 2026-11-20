const User = require("../models/User");
const Resume = require("../models/Resume");

exports.stats = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeUsers, admins, totalResumes, newUsers, newResumes, avg, templates] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "admin" }),
      Resume.countDocuments(),
      User.countDocuments({ createdAt: { $gte: since } }),
      Resume.countDocuments({ createdAt: { $gte: since } }),
      Resume.aggregate([{ $match: { lastAtsScore: { $ne: null } } }, { $group: { _id: null, avg: { $avg: "$lastAtsScore" } } }]),
      Resume.aggregate([{ $group: { _id: "$template", count: { $sum: 1 } } }]),
    ]);
    res.json({
      totalUsers,
      activeUsers,
      admins,
      totalResumes,
      newUsersLast7Days: newUsers,
      newResumesLast7Days: newResumes,
      averageAtsScore: avg[0] ? Math.round(avg[0].avg) : null,
      templateUsage: Object.fromEntries(templates.map((t) => [t._id, t.count])),
    });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = q
      ? { $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] }
      : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    const counts = await Resume.aggregate([{ $group: { _id: "$user", count: { $sum: 1 } } }]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json({
      users: users.map(({ password, __v, ...u }) => ({ ...u, resumeCount: countMap[String(u._id)] || 0 })),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own role or status" });
    }
    const update = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await Resume.deleteMany({ user: user._id });
    res.json({ message: "User and their resumes deleted" });
  } catch (err) {
    next(err);
  }
};
