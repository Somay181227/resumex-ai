const Resume = require("../models/Resume");
const ai = require("../services/aiService");
const { analyzeResume } = require("../services/atsEngine");

async function loadResume(req) {
  if (req.body.resumeId) {
    const r = await Resume.findOne({ _id: req.body.resumeId, user: req.user._id });
    if (!r) {
      const err = new Error("Resume not found");
      err.status = 404;
      throw err;
    }
    return r;
  }
  if (req.body.resume) return req.body.resume;
  const err = new Error("Provide resumeId or resume");
  err.status = 400;
  throw err;
}

async function saveScore(doc, score) {
  if (doc && typeof doc.save === "function") {
    doc.lastAtsScore = score;
    doc.lastAnalyzedAt = new Date();
    await doc.save();
  }
}

exports.status = (req, res) => res.json({ provider: ai.getProvider() });

exports.summary = async (req, res, next) => {
  try {
    const resume = await loadResume(req);
    res.json(await ai.generateSummary(resume.toObject ? resume.toObject() : resume));
  } catch (err) {
    next(err);
  }
};

exports.improve = async (req, res, next) => {
  try {
    const { text, section, position } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Text is required" });
    res.json(await ai.improveDescription(text, { section, position }));
  } catch (err) {
    next(err);
  }
};

exports.grammar = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Text is required" });
    res.json(await ai.checkGrammar(text));
  } catch (err) {
    next(err);
  }
};

exports.atsCheck = async (req, res, next) => {
  try {
    const doc = await loadResume(req);
    const resume = doc.toObject ? doc.toObject() : doc;
    const ats = analyzeResume(resume, req.body.jobDescription || "");
    await saveScore(doc, ats.score);
    res.json({ ats });
  } catch (err) {
    next(err);
  }
};

exports.analyze = async (req, res, next) => {
  try {
    const doc = await loadResume(req);
    const resume = doc.toObject ? doc.toObject() : doc;
    const jd = req.body.jobDescription || "";
    const ats = analyzeResume(resume, jd);
    const insights = await ai.analyze(resume, ats, jd);
    await saveScore(doc, ats.score);
    res.json({ ats, insights });
  } catch (err) {
    next(err);
  }
};
