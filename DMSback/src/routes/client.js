const Client = require("../models/Client");
const {
  verifyTokenAndAdmin,
  verifyToken,
  verifyTokenAndUser,
} = require("../middlewares/verifyToken");
const logger = require("../middlewares/logger");
const router = require("express").Router();

//CREATE
router.post("/", verifyTokenAndUser, async (req, res) => {
  const newClient = new Client(req.body);
  try {
    const savedClient = await newClient.save();
    res.status(200).json(savedClient);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      res
        .status(400)
        .json({
          error:
            "Naziv komitenta postoji. Naziv komitenta mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else {
      // Generalna poruka greške za frontend ako nije prepoznata specifična vrsta greške. Dok pravu gresku pisemo u logger.
      logger.error("Error create client:", err);
      res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom kreiranja komitenta.",
          code: "GENERIC_ERROR",
        });
    }
    return;
  }
});

//UPDATE
router.put("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true },
    );
    if (!updatedClient) {
      return res
        .status(404)
        .json({
          error: "Komitent koga menjate nije pronađen.",
          code: "NOT_FOUND",
        });
    }
    res.status(200).json(updatedClient);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      res
        .status(400)
        .json({
          error:
            "Naziv komitenta postoji. Naziv komitenta mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else {
      // Generalna poruka greške za frontend ako nije prepoznata specifična vrsta greške. Dok pravu gresku pisemo u logger.
      logger.error("Error edit client:", err);
      res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom izmene komitenta.",
          code: "GENERIC_ERROR",
        });
    }
    return;
  }
});

//DELETE
router.delete("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const document = await Document.findOne({ client: req.params.id });
    if (document) {
      return res
        .status(400)
        .json({
          error: "Postoje dokumenti sa ovim komitentom. Brisanje nije moguce!",
          code: "LINKED_DOCUMENT",
        });
    }
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) {
      return res
        .status(404)
        .json({
          error: "Komitent koga brišete nije pronadjen.",
          code: "NOT_FOUND",
        });
    }
    res.status(200).json("Client has been deleted.");
  } catch (err) {
    logger.error("Error delete client:", err);
    res
      .status(500)
      .json({ error: "Greška pri brisanju komitenta.", code: "GENERIC_ERROR" });
    return;
  }
});

//GET
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res
        .status(404)
        .json({ error: "Komitent nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(client);
  } catch (err) {
    logger.error("Error get client:", err);
    res
      .status(500)
      .json({ error: "Greška pri traženju komitenta.", code: "GENERIC_ERROR" });
    return;
  }
});

//GET ALL
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (err) {
    logger.error("Error get all clients:", err);
    res
      .status(500)
      .json({
        error: "Greška pri traženju komitenata.",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

module.exports = router;
