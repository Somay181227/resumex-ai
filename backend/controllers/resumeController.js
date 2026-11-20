const Resume = require("../models/Resume");

const EDITABLE = ["title", "template", "personal", "education", "experience", "skills", "projects", "certifications"];

const pick = (body) =>
  EDITABLE.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

const findOwned = (id, userId) => Resume.findOne({ _id: id, user: userId });

exports.list = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).select("lastAtsScore template updatedAt");
    const scored = resumes.filter((r) => typeof r.lastAtsScore === "number");
    const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.lastAtsScore, 0) / scored.length) : null;
    const best = scored.length ? Math.max(...scored.map((r) => r.lastAtsScore)) : null;
    res.json({
      totalResumes: resumes.length,
      analyzedResumes: scored.length,
      averageAtsScore: avg,
      bestAtsScore: best,
      lastUpdated: resumes[0]?.updatedAt || null,
    });
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const resume = await findOwned(req.params.id, req.user._id);
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json({ resume });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const resume = await Resume.create({ ...pick(req.body), user: req.user._id });
    res.status(201).json({ resume });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: pick(req.body) },
      { new: true, runValidators: true }
    );
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json({ resume });
  } catch (err) {
    next(err);
  }
};

exports.duplicate = async (req, res, next) => {
  try {
    const src = await findOwned(req.params.id, req.user._id);
    if (!src) return res.status(404).json({ message: "Resume not found" });
    const data = src.toObject();
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    const copy = await Resume.create({ ...data, title: `${src.title.slice(0, 113)} (Copy)` });
    res.status(201).json({ resume: copy });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json({ message: "Resume deleted" });
  } catch (err) {
    next(err);
  }
};
