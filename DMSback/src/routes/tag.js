const Tag = require("../models/Tag");
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
router.post("/", verifyTokenAndUser, async (req, res) => {
  const newTag = new Tag(req.body);
  try {
    const savedTag = await newTag.save();
    res.status(200).json(savedTag);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      res
        .status(400)
        .json({
          error: "Naziv taga postoji. Naziv taga mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else {
      logger.error("Error create tag:", err);
      res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom kreiranja taga.",
          code: "GENERIC_ERROR",
        });
    }
  }
  return;
});

//UPDATE
router.put("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const updatedTag = await Tag.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true },
    );
    if (!updatedTag) {
      return res
        .status(404)
        .json({ error: "Tag koji menjate nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(updatedTag);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      res
        .status(400)
        .json({
          error: "Naziv taga postoji. Naziv taga mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else {
      logger.error("Error edit tag:", err);
      res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom izmene taga.",
          code: "GENERIC_ERROR",
        });
    }
    return;
  }
});

//DELETE
router.delete("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const collection = req.collection;
    const document = await collection.findOne({
      tags: { $in: [req.params.id] },
    });
    if (document) {
      return res
        .status(400)
        .json({
          error: "Postoje dokumenti sa ovim tagom. Brisanje nije moguce!",
          code: "LINKED_DOCUMENT",
        });
    }

    const deletedTag = await Tag.findByIdAndDelete(req.params.id);
    if (!deletedTag) {
      return res
        .status(404)
        .json({ error: "Tag koji brišete nije pronadjen.", code: "NOT_FOUND" });
    }
    res.status(200).json("Tag has been deleted.");
  } catch (err) {
    logger.error("Error delete tag:", err);
    res
      .status(500)
      .json({ error: "Greška pri brisanju taga.", code: "GENERIC_ERROR" });
    return;
  }
});

//GET TABLE
router.get("/:id", async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res
        .status(404)
        .json({ error: "Tag nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(tag);
  } catch (err) {
    logger.error("Error get tag:", err);
    res
      .status(500)
      .json({ error: "Greška pri traženju taga.", code: "GENERIC_ERROR" });
    return;
  }
});

//GET ALL TABLE
router.get("/", async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    return res.status(200).json(tags);
  } catch (err) {
    logger.error("Error get all tags:", err);
    res
      .status(500)
      .json({ error: "Greška pri traženju tagova.", code: "GENERIC_ERROR" });
    return;
  }
});

module.exports = router;
