const router = require("express").Router();
const Company = require("../models/Company");
const { createCompanyFolders, getDmsFolderPath } = require("../utils/storage");
const {
  verifyToken,
  verifyTokenAndSuperAdmin,
} = require("../middlewares/verifyToken");
const { createDocumentDuplicateModel } = require("../models/documentDynamic");
const logger = require("../middlewares/logger");
const { auditLog, getChanges } = require("../utils/auditLog");
const fs = require("fs");
const path = require("path");

const isValidFolderName = (name) => {
  const invalidChars = /[<>:"/\\|?*]/;
  return !invalidChars.test(name);
};
// CREATE
router.post("/", verifyTokenAndSuperAdmin, async (req, res) => {
  try {
    const newCompany = new Company(req.body);
    const savedCompany = await newCompany.save();
    const companyCollectionName = `firma_${savedCompany?._id}`;

    let folderName;
    if (savedCompany.folderName && isValidFolderName(savedCompany.folderName)) {
      folderName = savedCompany.folderName;
    } else {
      folderName = companyCollectionName;
    }

    //ime foldera
    createCompanyFolders(folderName);
    //ovo bih ostavio kolekcija naziv 'firma_company.id'
    createDocumentDuplicateModel(companyCollectionName);

    if (folderName === companyCollectionName) {
      savedCompany.folderName = companyCollectionName;
      await savedCompany.save();
    }
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      action: "CREATE",
      resource: "Company",
      resourceId: savedCompany._id,
      resourceName: savedCompany.name,
      endpoint: req.originalUrl,
      status: 200,
    });
    return res.status(200).json(savedCompany);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      return res
        .status(400)
        .json({
          error:
            "Naziv kompanije postoji. Naziv kompanije mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else {
      // Generalna poruka greške za frontend ako nije prepoznata specifična vrsta greške. Dok pravu gresku pisemo u logger.
      logger.error("Error create user:", err);
      return res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom kreiranja kompanije.",
          code: "GENERIC_ERROR",
        });
    }
  }
});

//UPDATE
router.put("/:id", verifyTokenAndSuperAdmin, async (req, res) => {
  try {
    const oldCompany = await Company.findById(req.params.id);
    const updatedClient = await Company.findByIdAndUpdate(
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
          error: "Kompanija koju menjate nije pronađena.",
          code: "NOT_FOUND",
        });
    }
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      action: "UPDATE",
      resource: "Company",
      resourceId: updatedClient._id,
      resourceName: updatedClient.name,
      endpoint: req.originalUrl,
      status: 200,
      changes: oldCompany ? getChanges(oldCompany, updatedClient) : undefined,
    });
    return res.status(200).json(updatedClient);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.name) {
      // MongoDB duplicate key error
      return res
        .status(400)
        .json({
          error:
            "Naziv kompanije postoji. Naziv kompanije mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else {
      // Generalna poruka greške za frontend ako nije prepoznata specifična vrsta greške. Dok pravu gresku pisemo u logger.
      logger.error("Error edit user:", err);
      return res
        .status(500)
        .json({
          error: "Došlo je do greške prilikom izmene kompanije.",
          code: "GENERIC_ERROR",
        });
    }
  }
});

//DELETE
//fake delete
router.delete("/:id", verifyTokenAndSuperAdmin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res
        .status(404)
        .json({ error: "Kompanija nije pronađena.", code: "NOT_FOUND" });
    }
    const uploadDir = path.join(getDmsFolderPath(), company.folderName);
    console.log(fs.readdirSync(uploadDir).length);
    const isEmpty = fs.readdirSync(uploadDir).length === 3; //podrazumevano tri foldera: izvestaji, obrisani, otpremljeni. Ostatak su dokumenti
    if (!isEmpty) {
      return res
        .status(400)
        .json({
          error: "Postoje dokumenti za ovu kompaniju. Brisanje nije moguce!",
          code: "LINKED_DOCUMENT",
        });
    }

    const deletedCompany = await Company.findByIdAndDelete(req.params.id);
    if (!deletedCompany) {
      return res
        .status(404)
        .json({
          error: "Kompanije koju brišete nije pronadjena.",
          code: "NOT_FOUND",
        });
    }
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      action: "DELETE",
      resource: "Company",
      resourceId: deletedCompany._id,
      resourceName: deletedCompany.name,
      endpoint: req.originalUrl,
      status: 200,
    });
    return res.status(200).json("Company has been deleted.");
  } catch (err) {
    logger.error("Error delete company:", err);
    return res
      .status(500)
      .json({ error: "Greška pri brisanju kompanije.", code: "GENERIC_ERROR" });
  }
});

//GET ALL COMPANIES
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    return res.status(200).json(companies);
  } catch (err) {
    logger.error("Error get all companies:", err);
    return res
      .status(500)
      .json({ error: "Greška pri traženju kompanija.", code: "GENERIC_ERROR" });
  }
});

//GET
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res
        .status(404)
        .json({ error: "Kompanija nije pronađena.", code: "NOT_FOUND" });
    }
    return res.status(200).json(company);
  } catch (err) {
    logger.error("Error get company:", err);
    return res
      .status(500)
      .json({ error: "Greška pri traženju kompanije.", code: "GENERIC_ERROR" });
  }
});

module.exports = router;
