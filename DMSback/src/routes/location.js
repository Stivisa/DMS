const Location = require("../models/Location");
const {
  verifyTokenAndUser,
} = require("../middlewares/verifyToken");
const logger = require("../middlewares/logger");
const { auditLog, getChanges } = require("../utils/auditLog");
const router = require("express").Router();

//CREATE
router.post("/", verifyTokenAndUser, async (req, res) => {
  const newLocation = new Location(req.body);
  try {
    const savedLocation = await newLocation.save();
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "CREATE",
      resource: "Location",
      resourceId: savedLocation._id,
      resourceName: savedLocation.name,
      endpoint: req.originalUrl,
      status: 200,
    });
    return res.status(200).json(savedLocation);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      return res.status(400).json({
        error: "Lokacija već postoji. Naziv lokacije mora biti jedinstven!",
        code: "NAME_DUPLICATE",
      });
    } else {
      logger.error("Error create location:", err);
      return res.status(500).json({
        error: "Došlo je do greške prilikom kreiranja lokacije.",
        code: "GENERIC_ERROR",
      });
    }
  }
});

//UPDATE
router.put("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const oldLocation = await Location.findById(req.params.id);
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
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "UPDATE",
      resource: "Location",
      resourceId: updatedLocation._id,
      resourceName: updatedLocation.name,
      endpoint: req.originalUrl,
      status: 200,
      changes: oldLocation ? getChanges(oldLocation, updatedLocation) : undefined,
    });
    return res.status(200).json(updatedLocation);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      return res.status(400).json({
        error: "Lokacija već postoji. Naziv lokacije mora biti jedinstven!",
        code: "NAME_DUPLICATE",
      });
    } else {
      logger.error("Error edit location:", err);
      return res.status(500).json({
        error: "Došlo je do greške prilikom izmene lokacije.",
        code: "GENERIC_ERROR",
      });
    }
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
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "DELETE",
      resource: "Location",
      resourceId: deletedLocation._id,
      resourceName: deletedLocation.name,
      endpoint: req.originalUrl,
      status: 200,
    });
    return res.status(200).json("Location has been deleted.");
  } catch (err) {
    logger.error("Error delete location:", err);
    return res.status(500).json({
      error: "Greška pri brisanju lokacije.",
      code: "GENERIC_ERROR",
    });
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
    return res.status(200).json(location);
  } catch (err) {
    logger.error("Error get location:", err);
    return res.status(500).json({
      error: "Greška pri traženju lokacije.",
      code: "GENERIC_ERROR",
    });
  }
});

//GET ALL
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    return res.status(200).json(locations);
  } catch (err) {
    logger.error("Error get all locations:", err);
    return res.status(500).json({
      error: "Greška pri traženju lokacija.",
      code: "GENERIC_ERROR",
    });
  }
});

module.exports = router;
