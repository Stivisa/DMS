const { createDocumentDuplicateModel } = require("../models/documentDynamic");
const logger = require("./logger");

const companyCollectionMiddleware = async (req, res, next) => {
  const companyFolder = req.headers?.companyfolder;
  const companyId = req.headers?.companyid;
  if (!companyFolder && !companyId) {
    logger.error("Company collection/folder name not provided in headers.");
    res
      .status(500)
      .json({
        error: "Greška prilikom formiranja zahteva.",
        code: "GENERIC_ERROR",
      });
    return;
  }
  const collectionName = `firma_${companyId}`;
  req.collectionName = collectionName;
  req.companyfolder = companyFolder;
  req.companyId = companyId;
  const temp = await createDocumentDuplicateModel(collectionName);
  req.collection = temp;
  next();
};

module.exports = companyCollectionMiddleware;