const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");
const c = require("../controllers/aiController");

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.use(protect);
router.get("/status", c.status);
router.post("/summary", aiLimiter, c.summary);
router.post("/improve", aiLimiter, c.improve);
router.post("/grammar", aiLimiter, c.grammar);
router.post("/analyze", aiLimiter, c.analyze);
router.post("/ats", c.atsCheck);

module.exports = router;
