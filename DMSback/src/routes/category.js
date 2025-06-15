const Category = require("../models/Category");
const {
  verifyTokenAndAdmin,
  verifyToken,
  verifyTokenAndUser,
} = require("../middlewares/verifyToken");
const logger = require("../middlewares/logger");

const router = require("express").Router();

const companyCollectionMiddleware = require("../middlewares/companyCollectionMiddleware");

router.use(companyCollectionMiddleware);

//CREATE
router.post("/", verifyTokenAndAdmin, async (req, res) => {
  const newCategory = new Category(req.body);
  try {
    const savedCategory = await newCategory.save();
    return res.status(200).json(savedCategory);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      // MongoDB duplicate key error
      return res
        .status(400)
        .json({
          error:
            "Naziv kategorije postoji. Naziv kategorije mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else if (err.code === 11000 && err.keyPattern?.serialNumber){
      return res.status(400).json({ error: "Redni broj dokumenta postoji. Redni broj dokumenta mora biti jedinstven!", code: "SERIALNUMBER_DUPLICATE" });
    } else {
      logger.error("Error create category:", err);
      return res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom kreiranja kategorije.",
          code: "GENERIC_ERROR",
        });
    }
  }
});

//UPDATE
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true },
    );
    if (!updatedCategory) {
      return res
        .status(404)
        .json({
          error: "Kategorija koju menjate nije pronađena.",
          code: "NOT_FOUND",
        });
    }
    res.status(200).json(updatedCategory);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      return res
        .status(400)
        .json({
          error:
            "Naziv kategorije postoji. Naziv kategorije mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else if (err.code === 11000 && err.keyPattern?.serialNumber){
      return res.status(400).json({ error: "Redni broj dokumenta postoji. Redni broj dokumenta mora biti jedinstven!", code: "SERIALNUMBER_DUPLICATE" });
    } else {
      logger.error("Error edit category:", err);
      return res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom izmene kategorije.",
          code: "GENERIC_ERROR",
        });
    }
  }
});

router.get("/serial-number/latest", verifyTokenAndUser, async (req, res) => {
  try {
    const latestDocument = await Category.findOne()
      .sort({ serialNumber: -1 })
      .lean();
    if (!latestDocument) {
      return res.json({ latestSerialNumber: 0 });
    } else {
      const latestSerialNumber = latestDocument.serialNumber;
      return res.json({ latestSerialNumber });
    }
  } catch (err) {
    logger.error("Error getting category latest serial number:", err);
    return res
      .status(500)
      .json({
        error: "Greška pri traženju kategorija.",
        code: "GENERIC_ERROR",
      });
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const collection = req.collection;
    const document = await collection.findOne({
      categories: { $in: [req.params.id] },
    });
    if (document) {
      return res
        .status(400)
        .json({
          error: "Postoje dokumenti sa ovom kategorijom. Brisanje nije moguce!",
          code: "LINKED_DOCUMENT",
        });
    }
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res
        .status(404)
        .json({ error: "Tag koji brišete nije pronadjen.", code: "NOT_FOUND" });
    }
    res.status(200).json("Category has been deleted.");
  } catch (err) {
    logger.error("Error delete category:", err);
    return res
      .status(500)
      .json({
        error: "Greška pri brisanju kategorije.",
        code: "GENERIC_ERROR",
      });
  }
});

//GET
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ error: "Kategorija nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(category);
  } catch (err) {
    logger.error("Error get category:", err);
    return res
      .status(500)
      .json({
        error: "Greška pri traženju kategorije.",
        code: "GENERIC_ERROR",
      });
  }
});

//GET ALL
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json(categories);
  } catch (err) {
    logger.error("Error get all categories:", err);
    return res
      .status(500)
      .json({
        error: "Greška pri traženju kategorija.",
        code: "GENERIC_ERROR",
      });
  }
});

module.exports = router;
