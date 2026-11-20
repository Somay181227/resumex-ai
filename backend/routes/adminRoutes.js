const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const c = require("../controllers/adminController");

router.use(protect, adminOnly);
router.get("/stats", c.stats);
router.get("/users", c.listUsers);
router.patch("/users/:id", c.updateUser);
router.delete("/users/:id", c.deleteUser);

module.exports = router;
