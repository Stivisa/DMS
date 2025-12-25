const mongoose = require("mongoose");
const {
  getDmsFolderPath,
  deleteFile,
  getDmsReportFolderPath,
  getDmsCompanyFolderPath,
} = require("../utils/storage");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUser,
} = require("../middlewares/verifyToken");
const fs = require("node:fs");
const path = require("path");
const formidable = require("formidable");
const fse = require("fs-extra");
const router = require("express").Router();
const archiver = require("archiver");
const { generatePdf } = require("../utils/archiveBook");
const { generateExpiredReport } = require("../utils/expiredReport");
const Setting = require("../models/Setting");
const Company = require("../models/Company");
const logger = require("../middlewares/logger");
const CustomError = require("../utils/CustomError");
const { format } = require('date-fns');
const publicRouter = require("express").Router();
const companyCollectionMiddleware = require("../middlewares/companyCollectionMiddleware");

router.use(companyCollectionMiddleware);

// CREATE endpoint for uploading folder/file and form data
router.post("/", verifyTokenAndUser, async (req, res) => {
  const collection = req.collection;
  const companyFolder = req.companyfolder;
  const uploadDir = path.join(getDmsCompanyFolderPath(companyFolder));
  let result = {};

  try {
    const { fields, files } = await parseForm(req, uploadDir);
    result = processFields(fields);

    let folderName, saveFolderPath, singleFilePath, totalSize;
    if (files.files?.length >= 0) {
      folderName = fields.folderName ? fields.folderName[0] : null;
      ( {saveFolderPath, singleFilePath, totalSize}  = await handleFileUploads(
        files.files,
        uploadDir,
        folderName,
      ));

      result.filePath = folderName ? saveFolderPath : singleFilePath || null;
      if (result.filePath === null) {
        delete result.filePath;
      }

      validateFileSize(result.fileSize, totalSize);
    }
    const newDocument = new collection(result);
    newDocument.createdByUser = req.user.id;
    const savedDocument = await newDocument.save();

    res.status(200).json(savedDocument);
  } catch (err) {
    console.log("result.filePath", result?.filePath);
    handleError(res, err, result?.filePath, uploadDir);
    return;
  }
});

router.put("/:id", verifyTokenAndUser, async (req, res) => {
  const collection = req.collection;
  const companyFolder = req.companyfolder;
  const uploadDir = path.join(getDmsCompanyFolderPath(companyFolder));
  let result = {};

  try {
    const { fields, files } = await parseForm(req, uploadDir);
    const result = processFields(fields);
    
    let folderName, saveFolderPath, singleFilePath, totalSize;
    
      folderName = fields.folderName ? fields.folderName[0] : null;
      ({ saveFolderPath, singleFilePath, totalSize } = await handleFileUploads(
        files.files,
        uploadDir,
        folderName,
      ));

      result.filePath = folderName ? saveFolderPath : singleFilePath || null;
      if (result.filePath === null) {
        delete result.filePath;
      }

      validateFileSize(result.fileSize, totalSize);

    result.lastUpdatedByUser = req.user.id;
    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      { $set: result },
      { new: true },
    );

    if (!updatedDocument) {
      return res
        .status(404)
        .json({
          error: "Dokument koji menjate nije pronađen.",
          code: "NOT_FOUND",
        });
    }

    res.status(200).json(updatedDocument);
  } catch (err) {
    handleError(res, err, result?.filePath, uploadDir);
    return;
  }
});

//RECYCLE to recycle bin, set isDeleted to true
router.put("/recycle/:id", verifyTokenAndUser, async (req, res) => {
  let oldFilePath, oldPath, newPath;
  let renamed = false;
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;

    oldFilePath = req.body.filePath;
    newFilePath = null;
    oldPath = null;
    newPath = null;

    if (oldFilePath) {
      oldPath = path.join(
        getDmsCompanyFolderPath(companyFolder),
        oldFilePath,
      );
      const directory = path.dirname(path.dirname(oldPath));
      const filename = path.basename(oldPath);

      newFilePath = path.join("obrisani", filename);
      newPath = path.join(directory, newFilePath);
      if (fs.existsSync(newPath)) {
        res
          .status(400)
          .json({
            error: "Fajl vec postoji medju privremeno obrisanima!",
            code: "FILE_EXISTS_IN_RECYCLE",
          });
          return;
      }
      await fs.promises.rename(oldPath, newPath);
      renamed = true;
    } 
    const update = {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        lastUpdatedByUser: req.user.id,
      },
    };
    
    if (oldFilePath) {
      update.$set.filePath = newFilePath;
    }
    
    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );
    if (!updatedDocument) {
      if (oldFilePath) {
        await fs.promises.rename(newPath, oldPath);
      }
      return res
        .status(404)
        .json({
          error: "Dokument koji menjate nije pronađen.",
          code: "NOT_FOUND",
        });
    }
    return res.status(200).json(updatedDocument);
  } catch (err) {
    logger.error("Error recycle document:", err);
    if (oldFilePath && renamed) {
      await fs.promises.rename(newPath, oldPath);
    }
    res
      .status(500)
      .json({
        error: "Greška prilikom brisanja dokumenta.",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

//RESTORE from recycle bin, set isDeleted to false
router.put("/restore/:id", verifyTokenAndUser, async (req, res) => {
  let oldFilePath, oldPath, newPath;
  let renamed = false;
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;

    oldFilePath = req.body.filePath;
    newFilePath = null;
    oldPath = null;
    newPath = null;

    if (oldFilePath) {
      oldPath = path.join(
        getDmsCompanyFolderPath(companyFolder),
        oldFilePath,
      );
      const directory = path.dirname(path.dirname(oldPath));
      const filename = path.basename(oldPath);

      newFilePath = path.join("arhiva", filename);
      newPath = path.join(directory, newFilePath);
      if (fs.existsSync(newPath)) {
        res
          .status(400)
          .json({
            error: "Fajl vec postoji medju trenutnim dokumentima!",
            code: "FILE_EXISTS_IN_UPLOAD",
          });
      }

      await fs.promises.rename(oldPath, newPath);
      renamed = true;
    }
    const update = {
      $set: {
        isDeleted: false,
        deletedAt: null,
        lastUpdatedByUser: req.user.id,
      },
    };
    
    if (oldFilePath) {
      update.$set.filePath = newFilePath;
    }
    
    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );
    if (!updatedDocument) {
      if (oldFilePath) {
        await fs.promises.rename(newPath, oldPath);
      }
      return res
        .status(404)
        .json({
          error: "Dokument koji menjate nije pronađen.",
          code: "NOT_FOUND",
        });
    }
    res.status(200).json(updatedDocument);
  } catch (err) {
    logger.error("Error restore document:", err);
    if (oldFilePath && renamed) {
      await fs.promises.rename(newPath, oldPath);
    }
    res
      .status(500)
      .json({
        error: "Greška prilikom povratka dokumenta.",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

//DELETE only available from recycle bin
router.delete("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;

    const deletedDocument = await collection.findByIdAndDelete(req.params.id);
    if (!deletedDocument) {
      return res
        .status(404)
        .json({
          error: "Dokument koji brišete nije pronadjen.",
          code: "NOT_FOUND",
        });
    }
    if (deletedDocument && deletedDocument.filePath) {
      try {
        const fileToDelete = path.join(
          getDmsCompanyFolderPath(companyFolder),
          deletedDocument.filePath,
        );
        await deleteFile(fileToDelete);
      } catch (err) {
        throw err;
      }
    }
    res.status(200).json("Document has been deleted.");
  } catch (err) {
    logger.error("Error delete document:", err);
    res
      .status(500)
      .json({
        error: "Greška pri trajnom brisanju dokumenta!",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

//GET
router.get("/:id", async (req, res) => {
  try {
    const collection = req.collection;
    const document = await collection.findById(req.params.id);
    if (!document) {
      return res
        .status(404)
        .json({ error: "Dokument nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(document);
  } catch (err) {
    logger.error("Error get document:", err);
    res
      .status(500)
      .json({ error: "Greška pri traženju dokumenta.", code: "GENERIC_ERROR" });
    return;
  }
});

//GET ALL wih query params
router.get("/", async (req, res) => {
  const queryParams = getQueryParams(req);
  queryParams.page = parseInt(req.query.page) || 1;
  queryParams.limit = parseInt(req.query.limit) || 12; 
  try {
    const collection = req.collection;
    let documents;
    let count;

    const { query, sortOptions } = generateQueryAndSortOptions(queryParams);

    count = await collection.countDocuments(query);

    const page = queryParams.page;
    const limit = queryParams.limit;
    documents = await collection
      .find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categories");
    
    return res.status(200).json({
      page,
      limit,
      totalDocuments: count,
      totalPages: Math.ceil(count / limit),
      data: documents,
    });
  } catch (err) {
    logger.error("Error get all documents:", err);
    res
      .status(500)
      .json({
        error: "Greška pri traženju dokumenata.",
        code: "GENERIC_ERROR",
      });
      return;
  }
});

//GET ALL from recycle bin
router.get("/recycle/all", async (req, res) => {
  try {
    const collection = req.collection;
    let documents;
    documents = await collection.find({ isDeleted: true }).sort({
      //createdAt: -1,
      originDate: -1,
    }).populate("categories");

    res.status(200).json(documents);
  } catch (err) {
    logger.error("Error get all documents from recycle bin:", err);
    res
      .status(500)
      .json({
        error: "Greška pri traženju dokumenata iz obrisanih.",
        code: "GENERIC_ERROR",
      });
      return;
  }
});

router.get("/serial-number/latest", async (req, res) => {
  try {
    const collection = req.collection;
    //console.log("collection", collection)
    const latestDocument = await collection
      .findOne()
      .sort({ serialNumber: -1 })
      .lean();
    if (!latestDocument) {
      return res.json({ latestSerialNumber: 0 });
    }
    const latestSerialNumber = latestDocument.serialNumber;
    res.json({ latestSerialNumber });
  } catch (err) {
    logger.error("Error getting document latest serial number:", err);
    res
      .status(500)
      .json({
        error: "Greška pri traženju dokumenata.",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

//download single file, /file/:id bilo ,ali dodati query da bi radilo posao i za folder sadrzaj download/preview
router.get("/file/download", verifyTokenAndUser, async (req, res) => {
  const { id, folderId, fileName } = req.query;
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;
    let filePath;

    if (id) {
      const document = await collection.findById(id);
      if (!document) {
        throw new CustomError("Dokument nije pronađen.", "NOT_FOUND");
      }
      filePath = path.join(
        getDmsCompanyFolderPath(companyFolder),
        document.filePath,
      );
    } else if (folderId && fileName) {
      const folderDocument = await collection.findById(folderId);
      if (!folderDocument) {
        throw new CustomError("Dokument foldera nije pronađen.", "NOT_FOUND");
      }
      const folderPath = path.join(
        getDmsCompanyFolderPath(companyFolder),
        folderDocument.filePath,
      );
      filePath = path.join(folderPath, fileName);
    } else {
      throw new CustomError("Loši parametri.", "BAD_PARAMETERS");
    }

    if (!fs.existsSync(filePath)) {
      throw new CustomError("Nije pronadjen fajl.", "FILE_NOT_FOUND");
    }

    const fileName = path.basename(filePath);
    res.setHeader(
      "Content-Disposition",
      createContentDisposition(fileName),
    );
    res.setHeader("Content-Type", "application/octet-stream");

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    readStream.on("error", (err) => {
      throw err;
    });
  } catch (err) {
    if (err instanceof CustomError) {
      res.status(400).json({ error: err.message, code: err.code });
    } else {
      logger.error("Error file download:", err);
      res
        .status(500)
        .json({
          error: "Greška prilikom preuzimanja fajla.",
          code: "GENERIC_ERROR",
        });
    }
    return;
  }
});
//download folder
router.get("/folder/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;
    const document = await collection.findById(req.params.id);
    if (!document) {
      return res
        .status(404)
        .json({ error: "Dokument nije pronađen.", code: "NOT_FOUND" });
    }

    const folderPath = path.join(
      getDmsCompanyFolderPath(companyFolder),
      document.filePath,
    );

    res.setHeader(
      "Content-Disposition",
      createContentDisposition(`${path.basename(folderPath)}.zip`),
    );
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level
    });

    archive.on("error", (err) => {
      throw err;
    });

    // Pipe the archive to the response
    archive.pipe(res);

    // Append files from the folder to the archive
    archive.directory(folderPath, false);

    // Finalize the archive (this will send the file)
    archive.finalize();
  } catch (err) {
    logger.error("Error folder download:", err);
    res
      .status(500)
      .json({
        error: "Greška prilikom preuzimanja foldera.",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

router.get("/folder-contents/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;
    const document = await collection.findById(req.params.id);
    if (!document) {
      return res
        .status(404)
        .json({ error: "Dokument nije pronađen.", code: "NOT_FOUND" });
    }
    const folderPath = path.join(
      getDmsCompanyFolderPath(companyFolder),
      document.filePath,
    );

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        throw err;
      }

      // Map file names to their full paths
      //msm da se path ne koristi
      const fileDetails = files.map((file) => {
        return {
          name: file,
          path: path.join(folderPath, file),
        };
      });

      res.status(200).json(fileDetails);
    });
  } catch (err) {
    logger.error("Error folder content:", err);
    res
      .status(500)
      .json({
        error: "Greška prilikom pregleda foldera.",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

//IMPORT JSON disabled for now
router.post("/import/json", verifyTokenAndAdmin, (req, res) => {
  //console.log(req.body);
  /*
  insertMany() ends up as one atomic insertMany() command that Mongoose sends to the MongoDB server, 
  but CREATE () ends up as a bunch of separate insertOne() calls
  INSERT MANY
  Setting ordered: false in the insertMany will insert ALL documents that are possible and "skip" those that throw an error. 
  But when finished, the function itself will report/throw an error with all information on how many documents had been saved and how many not.
  */
  const collection = req.collection;
  collection
    .insertMany(req.body?.importjson, { ordered: false })
    .then((response) => {
      //console.log("saved to mongo db", response);
      res.status(200).json(response);
    })
    .catch((error) => {
      //return error even if skipped duplicate correctly
      console.log("error in saving to mongo db", error);
      return res.status(500).json(error);
    });
  /*
  Document.create(req.body?.importjson)
    .then((response) => {
      //console.log("saved to mongo db", response);
      res.status(200).json(response);
    })
    .catch((error) => {
      console.log("error in saving to mongo db", error);
      res.status(500).json(error);
      //error?.keyValue._id //if you adding existing id
    });
    */
});

// Custom endpoint to serve files from any folder
publicRouter.get("/report/:filename", (req, res) => {
  const { folder } = req.query;
  const filename = req.params.filename;
  try{
    if (!folder) {
      logger.error("Folder parameter is missing.");
      return res
      .status(404)
      .json({ error: "Greška prilikom preuzimanja izvještaja.", code: "FOLDER_NOT_FOUND" });
    }

    const reportPath = path.join(getDmsReportFolderPath(folder));
    const filepath = path.join(reportPath, filename);

    // Check if the file exists
    if (!fs.existsSync(filepath)) {
      logger.error(`Report not found: ${filepath}`);
      return res
      .status(404)
      .json({ error: "Greška prilikom preuzimanja izvještaja.", code: "FILE_NOT_EXISTS" });
    }

    // Set headers to serve the file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", createContentDisposition(filename, 'inline'));

    // Stream the file to the client
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (err) {
    logger.error("Error serving report file:", err);
    res
      .status(500)
      .json({
        error: "Greška prilikom preuzimanja izvještaja.",
        code: "GENERIC_ERROR",
      });
    return;
    }
});

router.get("/generate/archivebook", verifyTokenAndUser, async (req, res) => {
  const queryParams = getQueryParams(req);
  queryParams.expired = false; //only active documents
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;
    const { query, sortOptions } = generateQueryAndSortOptions(queryParams);
    let documents;

    documents = await collection
      .find(query)
      .sort({ serialNumber: 1 })
      .populate("categories");

    const setting = await Setting.findOne({ name: "brojSaglasnosti" });
    if (!setting) {
      return res
        .status(404)
        .json({ error: "Broj saglasnosti nije pronađen.", code: "NOT_FOUND" });
    }
    const consentNumber = setting.value;

    const company = await Company.findById(req.companyId);
    if (!company) {
      return res
        .status(404)
        .json({ error: "Kompanija nije pronađena.", code: "NOT_FOUND" });
    }
    const companyName = company.name;

    await generatePdf(
      documents,
      companyName,
      companyFolder,
      consentNumber,
      queryParams.startdate,
      queryParams.enddate,
      res,
    );
  } catch (err) {
    logger.error("Error archive book:", err);
    res
      .status(500)
      .json({
        error: "Greška prilikom generisanja arhivske knjige.",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

//compare keepDate and set expired to true if keepDate is less than now
//maybe should be run once a day, cron job
//for now i dont want to run this, i will just compare keepDate
router.put('/check/expired', async (req, res) => {
  const queryParams = getQueryParams(req);
  queryParams.expired = false; //only active documents
  try {
    const { query, sortOptions } = generateQueryAndSortOptions(queryParams);
    const now = new Date();
    const collection = req.collection;

    await collection.updateMany(
      {
        ...query,
        keepDate: { $lte: now },
      },
      {
        $set: { expired: true },
      },
    );
    res.status(200).json({ message: 'Checked and updated expired documents successfully' });
  } catch (err) {
    logger.error('Error updating expired documents:', err);
    res.status(500).json({ error: 'Error updating expired documents', code: 'CHECKEXPIRED_ERROR' });
    return;
  }
});

router.get("/generate/reportexpired", verifyTokenAndUser, async (req, res) => {
  const queryParams = getQueryParams(req);
  queryParams.expired = true; //only expired documents
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;
    const { query, sortOptions } = generateQueryAndSortOptions(queryParams);
    let documents;

    documents = await collection.find(query).sort({ serialNumber: 1 }).populate("categories");

    const setting = await Setting.findOne({ name: "brojSaglasnosti" });
    if (!setting) {
      return res
        .status(404)
        .json({ error: "Broj saglasnosti nije pronađen.", code: "NOT_FOUND" });
    }
    const consentNumber = setting.value;

    const company = await Company.findById(req.companyId);
    if (!company) {
      return res
        .status(404)
        .json({ error: "Kompanija nije pronađena.", code: "NOT_FOUND" });
    }
    const companyName = company.name;

    await generateExpiredReport(
      documents,
      companyName,
      companyFolder,
      consentNumber,
      queryParams.startdate,
      queryParams.enddate,
      res,
    );
  } catch (err) {
    logger.error("Error archive book:", err);
    res
      .status(500)
      .json({
        error: "Greška prilikom generisanja izvestaja bezvrednog materijala.",
        code: "GENERIC_ERROR",
      });
    return;
  }
});

//move expired documents to recycle bin, only admin
router.delete('/delete/expired', verifyTokenAndAdmin, async (req, res) => {
  try {
    const queryParams = getQueryParams(req);
    queryParams.expired = true; //only expired documents
    const collection = req.collection;
    const companyFolder = req.companyfolder;

    const userId = req.user.id;

    const { query, sortOptions } = generateQueryAndSortOptions(queryParams);

    documents = await collection.find(query);
    const dmsPath = getDmsFolderPath();

    let oldFilePath, oldPath, newPath;
    let renamed = false;

    let errors = [];
    await Promise.all(documents.map(async (document) => {
      try {
      oldFilePath = document?.filePath;
      let newFilePath = null;
      oldPath = null;
      newPath = null;
      if (oldFilePath) {
        oldPath = path.join(
          getDmsCompanyFolderPath(companyFolder),
          oldFilePath,
        );
        const directory = path.dirname(path.dirname(oldPath));
        const filename = path.basename(oldPath);

        newFilePath = path.join("obrisani", filename);
        newPath = path.join(directory, newFilePath);
        //da ne ispitujem da li postoje u recyclebin, nego ako postoje preimenuj ih u unique tako sto dodat datetime
        if (fs.existsSync(newPath)) {
          const now = new Date();
          const formattedTimestamp = format(now, "yyyyMMddHHmmss");
          const parsedPath = path.parse(newFilePath);
          newFilePath = path.join(
            parsedPath.dir,
            `${parsedPath.name}${formattedTimestamp}${parsedPath.ext}`,
          );
          newPath = path.join(directory, newFilePath);
        }
        await fs.promises.rename(oldPath, newPath);
        renamed = true;
      }
      const update = {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          lastUpdatedByUser: userId,
        },
      };
      if (oldFilePath) {
        update.$set.filePath = newFilePath;
      }
  
      const result = await collection.updateOne(
        { _id: document._id },
        update,
      );
      if (result.matchedCount === 0) {
        if (oldFilePath) {
          await fs.promises.rename(newPath, oldPath); // rollback
        }
        errors.push({ id: document._id, error: 'Not found during update' });
      }
    } catch (err) {
      logger.error("Error deleting expired document:", err);
      if (oldFilePath && renamed) {
        try {
          await fs.promises.rename(newPath, oldPath); // rollback
        } catch (rollbackErr) {
          logger.error("Rollback failed:", rollbackErr);
        }
      }
      errors.push({ id: document?._id, error: err.message });
    }
  }));
    if (errors.length > 0) {
      logger.error("Error deleting expired document:", errors);
      res.status(500).json({
        error: "Greška prilikom brisanja isteklog dokumenta.",
        code: "GENERIC_ERROR",
      });
    }
    res.status(200).json("Expired documents has been deleted.");
  } catch (err) {
    logger.error("Error deleting expired documents:", err);
    res.status(500).json({
      error: "Greška prilikom brisanja isteklih dokumenata.",
      code: "GENERIC_ERROR",
    });
    return;
  }
});

const generateQueryAndSortOptions = (queryParams) => {
  const {
    category,
    tag,
    startdate,
    enddate,
    content,
    expired,
    sortOrder,
    sortBy,
  } = queryParams;

  let currentDate = new Date();

  const query = {
    isDeleted: false,
    //...(expired !== null && expired !== undefined && { expired }),
  };
  const sortOptions = {};

  if (expired) {
    query.keepDate = { $lt: currentDate };
  }
  else {
    query.$or = [
      { keepDate: { $gte: currentDate } },
      { keepDate: null }
    ];
  }

  if (category) {
    query.categories = { $in: [category] };
  }
  if (tag) {
    query.tags = { $in: [tag] };
  }
  if (startdate && enddate) {
    const startDate = new Date(startdate);
    const endDate = new Date(enddate);
    query.originDate = { $gte: startDate, $lte: endDate };
    //ne createdAt jer je to unos u DMS sistem, dok vreme nastanka moze biti drugo (tipa juce a danas unosi u sistem)
  }
  if (content) {
    query.content = { $regex: content, $options: "i" };
  }
  if (sortBy) {
    sortOptions[sortBy] = sortOrder === "true" ? -1 : 1;
  } else {
    sortOptions.createdAt = -1;
    //sortOptions.serialNumber = -1;
  }

  return { query, sortOptions };
};

const parseForm = async (req, uploadDir) => {
  const form = new formidable.IncomingForm();
  form.multiples = true;
  form.uploadDir = uploadDir;

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new Error(`Error parsing request form: ${err.message}`));
      } else {
        resolve({ fields, files });
      }
    });
  });
};

const processFields = (fields) => {
  const result = {};
  for (const key in fields) {
    /*
    //because on frontend was form.append and that formed array for each field in case if first try fails second form will append. Now is form.set
    if (Array.isArray(fields[key])) {
      const value = fields[key][fields[key].length - 1];
      if (value !== "undefined" && value !== "") {
        result[key] = value === "null" ? null : value;
      }
    }
    */
    value = fields[key][0];
    if (value !== "undefined" && value !== "") {
      result[key] = value === "null" ? null : value;
    }
  }
  if(result.tags){
    const tags = result.tags.split(',');
    result.tags = tags;
  }

  if(result.categories){
    const category = result.categories.split(',');
    result.categories = category;
  }

  return result;
};

const handleFileUploads = async (files, uploadDir, folderName) => {
  let totalSize = 0;
  let singleFilePath = null;
  let saveFolderPath = null;
  if (folderName) {
    saveFolderPath = path.join("arhiva", folderName);
    const createFolderPath = path.join(
      uploadDir,
      saveFolderPath,
    );
    if (!fs.existsSync(createFolderPath)) {
      fs.mkdirSync(createFolderPath);
    } else {
      logger.error(
        `Folder already exists: ${createFolderPath}`,
      );
      throw new CustomError(
        "Ime foldera postoji. Ime foldera mora biti jedinstveno!",
        "FOLDERNAME_DUPLICATE",
      );
    }
  }

  //bitno za update kod dokumenta koji nema fajl
  if (!files) {
    return { saveFolderPath, singleFilePath, totalSize }; // No files to process
  }

  const uploadedFiles = Array.isArray(files) ? files : [files];
  await Promise.all(
    uploadedFiles.map(async (file) => {
      const oldPath = file.filepath;
      singleFilePath = path.join("arhiva", file.originalFilename); //otpremljeni/(folder name if present)/filename
      const newPath = path.join(uploadDir, singleFilePath);

      if (fs.existsSync(newPath)) {
        logger.error(
          `File already exists: ${newPath}`,
        );
        throw new CustomError(
          "Ime fajla postoji. Ime fajla mora biti jedinstveno.",
          "FILENAME_DUPLICATE",
        );
      }

      await fs.promises.rename(oldPath, newPath);
      totalSize += file.size;
    }),
  );

  return { saveFolderPath, singleFilePath, totalSize };
};

const validateFileSize = (expectedSize, totalSize) => {
  const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
  if (expectedSize !== "0" && totalSizeInMB !== expectedSize) {
    logger.error(
      `Expected file size: ${expectedSize} MB, but received: ${totalSizeInMB} MB`,
    );
    throw new CustomError(
      "Velicina poslatog fajla se ne poklapa sa velicinom primljenog fajla.",
      "FILE_SIZE_MISMATCH",
    );
  }
};

const handleError = (res, err, filePath, uploadDir) => {
  if (filePath) {
    try {
      fse.remove(path.join(uploadDir, filePath));
    } catch (deleteErr) {
      logger.error(
        "Error deleting file/folder on failed operation:",
        deleteErr,
      );
    }
  }

  if (err.code === 11000) {
    if (err.keyPattern?.name) {
      res
        .status(400)
        .json({
          error:
            "Naziv dokumenta postoji. Naziv dokumenta mora biti jedinstven!",
          code: "NAME_DUPLICATE",
        });
    } else if (err.keyPattern?.filePath) {
      res
        .status(400)
        .json({
          error: "Ime fajla postoji. Ime fajla mora biti jedinstveno!",
          code: "FILENAME_DUPLICATE",
        });
    } else if (err.keyPattern?.serialNumber) {
      res
        .status(400)
        .json({
          error:
            "Redni broj dokumenta postoji. Redni broj dokumenta mora biti jedinstven!",
          code: "SERIALNUMBER_DUPLICATE",
        });
    }
  } else if (err instanceof CustomError) {
    res.status(400).json({ error: err.message, code: err.code });
  } else {
    logger.error("Error:", err);
    res
      .status(500)
      .json({ error: "Greška prilikom obrade.", code: "GENERIC_ERROR" });
  }
  return;
};

function getQueryParams(req) {
  return {
    category: req.query.category,
    tag: req.query.tag,
    startdate: req.query.startdate,
    enddate: req.query.enddate,
    content: req.query.content,
    expired: req.query.expired === "true", // qury params are strings, so we convert to boolean
    sortOrder: req.query.sortOrder,
    sortBy: req.query.sortBy,
  };
}

// Helper function to create safe Content-Disposition header with proper UTF-8 encoding
const createContentDisposition = (filename, disposition = 'attachment') => {
  const encodedFileName = encodeURIComponent(filename);
  const asciiFallback = filename.replace(/[^\x00-\x7F]/g, '_');
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodedFileName}`;
};

module.exports = { router, publicRouter };
