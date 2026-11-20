const router = require("express").Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/resumeController");

router.use(protect);
router.get("/", c.list);
router.get("/stats", c.stats);
router.post("/", c.create);
router.get("/:id", c.get);
router.put("/:id", c.update);
router.post("/:id/duplicate", c.duplicate);
router.delete("/:id", c.remove);

module.exports = router;
