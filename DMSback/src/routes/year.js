const Year = require("../models/Year");
const { verifyTokenAndUser } = require("../middlewares/verifyToken");

const router = require("express").Router();

//GET
router.get("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const year = await Year.findById(req.params.id);
    if (!year) {
      return res.status(404).json({ error: "Godina nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(year);
  } catch (err) {
    logger.error("Error get year:", err)
    res.status(500).json({ error: "Greška pri traženju godine.", code: "GENERIC_ERROR" });
  }
});

//GET ALL
router.get("/", verifyTokenAndUser, async (req, res) => {
  try {
    const years = await Year.find().sort({ value: -1 });
    res.status(200).json(years);
  } catch (err) {
    logger.error("Error get all years:", err)
    res.status(500).json({ error: "Greška pri traženju godina.", code: "GENERIC_ERROR" });
  }
});

module.exports = router;
