const Category = require("../models/Category");
const Document = require("../models/Document");
const { verifyTokenAndAdmin, verifyToken } = require("../middlewares/verifyToken");
const logger = require("../middlewares/logger");

const router = require("express").Router();

//CREATE
router.post("/", verifyTokenAndAdmin, async (req, res) => {
  const newCategory = new Category(req.body);
  try {
    const savedCategory = await newCategory.save();
    res.status(200).json(savedCategory);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) { // MongoDB duplicate key error
      res.status(400).json({ error: "Naziv kategorije postoji. Naziv kategorije mora biti jedinstven!", code: "NAME_DUPLICATE" });
    } /*else if (err.code === 11000 && err.keyPattern.label){
      res.status(400).json({ error: "Oznaka kategorije postoji. Oznaka kategorije mora biti jedinstven!", code: "LABEL_DUPLICATE" });
    }*/
    else{
      logger.error("Error create category:", err)
      res.status(500).json({ error: "Došlo je do greške prilikom kreiranja kategorije.", code: "GENERIC_ERROR" });
    }
  }
});

//UPDATE
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true },
    );
    if (!updatedCategory) {
      return res.status(404).json({ error: "Kategorija koju menjate nije pronađena.", code: "NOT_FOUND" });
    }
    res.status(200).json(updatedCategory);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) { // MongoDB duplicate key error
      res.status(400).json({ error: "Naziv kategorije postoji. Naziv kategorije mora biti jedinstven!", code: "NAME_DUPLICATE" });
    } /*else if (err.code === 11000 && err.keyPattern.label){
      res.status(400).json({ error: "Oznaka kategorije postoji. Oznaka kategorije mora biti jedinstven!", code: "LABEL_DUPLICATE" });
    }*/
    else{
      logger.error("Error edit category:", err)
      res.status(500).json({ error: "Došlo je do greške prilikom izmene kategorije.", code: "GENERIC_ERROR" });
    }
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const document = await Document.findOne({ category: req.params.id });
    if (document) {
      return res.status(400).json({ error: "Postoje dokumenti sa ovom kategorijom. Brisanje nije moguce!", code: "LINKED_DOCUMENT" });
    } 
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ error: "Tag koji brišete nije pronadjen.", code: "NOT_FOUND" });
    }
    res.status(200).json("Category has been deleted.");
  } catch (err) {
    logger.error("Error delete category:", err)
    res.status(500).json({ error: "Greška pri brisanju kategorije.", code: "GENERIC_ERROR" });
  }
});

//GET
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Kategorija nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(category);
  } catch (err) {
    logger.error("Error get category:", err)
    res.status(500).json({ error: "Greška pri traženju kategorije.", code: "GENERIC_ERROR" });
  }
});

//GET ALL
router.get("/", verifyToken, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (err) {
    logger.error("Error get all categories:", err)
    res.status(500).json({ error: "Greška pri traženju kategorija.", code: "GENERIC_ERROR" });
  }
});

module.exports = router;
