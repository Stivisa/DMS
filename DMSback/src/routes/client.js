const Client = require("../models/Client");
const {
  verifyTokenAndAdmin,
  verifyToken,
  verifyTokenAndUser,
} = require("../middlewares/verifyToken");
const logger = require("../middlewares/logger");
const { auditLog, getChanges } = require("../utils/auditLog");
const router = require("express").Router();

//CREATE
router.post("/", verifyTokenAndUser, async (req, res) => {
  const newClient = new Client(req.body);
  try {
    const savedClient = await newClient.save();
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "CREATE",
      resource: "Client",
      resourceId: savedClient._id,
      resourceName: savedClient.name,
      endpoint: req.originalUrl,
      status: 200,
    });
    return res.status(200).json(savedClient);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      return res
        .status(400)
        .json({
          error:
            "Naziv komitenta postoji. Naziv komitenta mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else {
      // Generalna poruka greške za frontend ako nije prepoznata specifična vrsta greške. Dok pravu gresku pisemo u logger.
      logger.error("Error create client:", err);
      return res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom kreiranja komitenta.",
          code: "GENERIC_ERROR",
        });
    }
  }
});

//UPDATE
router.put("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const oldClient = await Client.findById(req.params.id);
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
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "UPDATE",
      resource: "Client",
      resourceId: updatedClient._id,
      resourceName: updatedClient.name,
      endpoint: req.originalUrl,
      status: 200,
      changes: oldClient ? getChanges(oldClient, updatedClient) : undefined,
    });
    return res.status(200).json(updatedClient);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      return res
        .status(400)
        .json({
          error:
            "Naziv komitenta postoji. Naziv komitenta mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else {
      // Generalna poruka greške za frontend ako nije prepoznata specifična vrsta greške. Dok pravu gresku pisemo u logger.
      logger.error("Error edit client:", err);
      return res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom izmene komitenta.",
          code: "GENERIC_ERROR",
        });
    }
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
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "DELETE",
      resource: "Client",
      resourceId: deletedClient._id,
      resourceName: deletedClient.name,
      endpoint: req.originalUrl,
      status: 200,
    });
    return res.status(200).json("Client has been deleted.");
  } catch (err) {
    logger.error("Error delete client:", err);
    return res
      .status(500)
      .json({ error: "Greška pri brisanju komitenta.", code: "GENERIC_ERROR" });
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
    return res.status(200).json(client);
  } catch (err) {
    logger.error("Error get client:", err);
    return res
      .status(500)
      .json({ error: "Greška pri traženju komitenta.", code: "GENERIC_ERROR" });
  }
});

//GET ALL
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    return res.status(200).json(clients);
  } catch (err) {
    logger.error("Error get all clients:", err);
    return res
      .status(500)
      .json({
        error: "Greška pri traženju komitenata.",
        code: "GENERIC_ERROR",
      });
  }
});

module.exports = router;
