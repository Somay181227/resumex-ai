const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const c = require("../controllers/authController");

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  c.register
);
router.post(
  "/login",
  [body("email").isEmail().withMessage("Valid email is required"), body("password").notEmpty().withMessage("Password is required")],
  validate,
  c.login
);
router.post("/logout", protect, c.logout);
router.get("/me", protect, c.me);
router.put("/profile", protect, c.updateProfile);

module.exports = router;
