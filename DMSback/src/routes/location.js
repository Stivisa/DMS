const Location = require("../models/Location");
const {
  verifyTokenAndUser,
} = require("../middlewares/verifyToken");
const logger = require("../middlewares/logger");
const router = require("express").Router();

//CREATE
router.post("/", verifyTokenAndUser, async (req, res) => {
  const newLocation = new Location(req.body);
  try {
    const savedLocation = await newLocation.save();
    res.status(200).json(savedLocation);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      res.status(400).json({
        error: "Lokacija već postoji. Naziv lokacije mora biti jedinstven!",
        code: "NAME_DUPLICATE",
      });
    } else {
      logger.error("Error create location:", err);
      res.status(500).json({
        error: "Došlo je do greške prilikom kreiranja lokacije.",
        code: "GENERIC_ERROR",
      });
    }
    return;
  }
});

//UPDATE
router.put("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const updatedLocation = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    );
    if (!updatedLocation) {
      return res.status(404).json({
        error: "Lokacija koju menjate nije pronađena.",
        code: "NOT_FOUND",
      });
    }
    res.status(200).json(updatedLocation);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      res.status(400).json({
        error: "Lokacija već postoji. Naziv lokacije mora biti jedinstven!",
        code: "NAME_DUPLICATE",
      });
    } else {
      logger.error("Error edit location:", err);
      res.status(500).json({
        error: "Došlo je do greške prilikom izmene lokacije.",
        code: "GENERIC_ERROR",
      });
    }
    return;
  }
});

//DELETE
router.delete("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const deletedLocation = await Location.findByIdAndDelete(req.params.id);
    if (!deletedLocation) {
      return res.status(404).json({
        error: "Lokacija koju brišete nije pronađena.",
        code: "NOT_FOUND",
      });
    }
    res.status(200).json("Location has been deleted.");
  } catch (err) {
    logger.error("Error delete location:", err);
    res.status(500).json({
      error: "Greška pri brisanju lokacije.",
      code: "GENERIC_ERROR",
    });
    return;
  }
});

//GET
router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        error: "Lokacija nije pronađena.",
        code: "NOT_FOUND",
      });
    }
    res.status(200).json(location);
  } catch (err) {
    logger.error("Error get location:", err);
    res.status(500).json({
      error: "Greška pri traženju lokacije.",
      code: "GENERIC_ERROR",
    });
    return;
  }
});

//GET ALL
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    res.status(200).json(locations);
  } catch (err) {
    logger.error("Error get all locations:", err);
    res.status(500).json({
      error: "Greška pri traženju lokacija.",
      code: "GENERIC_ERROR",
    });
    return;
  }
});

module.exports = router;
