const mongoose = require("mongoose");
const {
  getDmsFolderPath,
  deleteFile,
  getDmsUploadFolderPath,
  getDmsCompanyFolderPath,
} = require("../utils/storage");
const { verifyToken, verifyTokenAndAdmin } = require("../middlewares/verifyToken");
const fs = require("node:fs");
const path = require('path');
const formidable = require('formidable');
const fse = require('fs-extra');
const router = require("express").Router();
const archiver = require('archiver');
const {createDocumentDuplicateModel} = require('../models/documentDynamic')
const {generatePdf} = require('../utils/archiveBook');
const {generateExpiredReport} = require('../utils/expiredReport');
const Setting = require("../models/Setting");
const Company = require("../models/Company");
const logger = require("../middlewares/logger");
const CustomError = require("../utils/CustomError");

router.use(async (req, res, next) => {
  const companyFolder = req.headers?.companyfolder;
  const companyId = req.headers?.companyid;
  if (!companyFolder) {
      //return res.status(400).json('Company collection/folder name not provided in headers.');
      logger.error("Company collection/folder name not provided in headers.");
      res.status(500).json({ error: "Greška prilikom formiranja zahteva.", code: "GENERIC_ERROR" });
  }
  const collectionName = `firma_${companyId}`;
	req.collectionName = collectionName;
  req.companyfolder = companyFolder;
  req.companyId = companyId;
	const temp = await createDocumentDuplicateModel(collectionName);
	req.collection = temp;
  next();
});

// CREATE endpoint for uploading folder/file and form data
router.post('/', verifyTokenAndAdmin, async (req, res) => {
  const collection = req.collection;
  const companyFolder = req.companyfolder;
  const uploadDir = path.join(getDmsCompanyFolderPath(companyFolder));
  let result = {};

  try {
    const { fields, files } = await parseForm(req, uploadDir);
    result = processFields(fields);

    let folderName = fields.folderName ? fields.folderName[0] : null;
    let { saveFolderPath, singleFilePath, totalSize } = await handleFileUploads(files.files, uploadDir, folderName);

    result.filePath = folderName ? saveFolderPath : singleFilePath || null;
    if (result.filePath === null) {
      delete result.filePath;
    }
    validateFileSize(result.fileSize, totalSize);

    const newDocument = new collection(result);
    newDocument.createdByUser = req.user.id;
    const savedDocument = await newDocument.save();

    res.status(200).json(savedDocument);   
  } 
  catch (err) {
    handleError(res, err, result?.filePath, uploadDir);
  }
});

router.put('/:id', verifyTokenAndAdmin, async (req, res) => {
  const collection = req.collection;
  const companyFolder = req.companyfolder;
  const uploadDir = path.join(getDmsCompanyFolderPath(companyFolder));
  let result = {};

  try {
    const { fields, files } = await parseForm(req, uploadDir);
    const result = processFields(fields);

    let folderName = fields.folderName ? fields.folderName[0] : null;
    let { saveFolderPath, singleFilePath, totalSize } = await handleFileUploads(files.files, uploadDir, folderName);

    result.filePath = folderName ? saveFolderPath : singleFilePath || null;
    if (result.filePath === null) {
      delete result.filePath;
    }
    validateFileSize(result.fileSize, totalSize);

    result.lastUpdatedByUser = req.user.id;
    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      { $set: result },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ error: "Dokument koji menjate nije pronađen.", code: "NOT_FOUND" });
    }

    res.status(200).json(updatedDocument);
  } catch (err) {
    handleError(res, err, result?.filePath, uploadDir);
  }
});

//RECYCLE to recycle bin, set isDeleted to true
router.put("/recycle/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;

    oldFilePath = req.body.filePath;
    const oldPath = path.join(getDmsCompanyFolderPath(companyFolder), oldFilePath);
    const directory = path.dirname(path.dirname(oldPath));
    const filename = path.basename(oldPath);

    newFilePath = path.join('obrisani', filename);
    const newPath = path.join(directory, newFilePath);
    if (fs.existsSync(newPath)) {
      res.status(400).json({ error: "Fajl vec postoji medju privremeno obrisanima!", code: "FILE_EXISTS_IN_RECYCLE" });
    }
    await fs.promises.rename(oldPath, newPath);

    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isDeleted: true, deletedAt: new Date(), lastUpdatedByUser: req.user.id , filePath: newFilePath},
      },
      { new: true },
    );
    if (!updatedDocument) {
      return res.status(404).json({ error: "Dokument koji menjate nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(updatedDocument);
  } catch (err) {
    logger.error("Error recycle document:", err)
    res.status(500).json({ error: "Greška prilikom brisanja dokumenta.", code: "GENERIC_ERROR" });
  }
});

//RESTORE from recycle bin, set isDeleted to false
router.put("/restore/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;

    oldFilePath = req.body.filePath;
    const oldPath = path.join(getDmsCompanyFolderPath(companyFolder), oldFilePath);
    const directory = path.dirname(path.dirname(oldPath));
    const filename = path.basename(oldPath);

    newFilePath = path.join('otpremljeni', filename);
    const newPath = path.join(directory, newFilePath);
    if (fs.existsSync(newPath)) {
      res.status(400).json({ error: "Fajl vec postoji medju trenutnim dokumentima!", code: "FILE_EXISTS_IN_UPLOAD" });
    }

    await fs.promises.rename(oldPath, newPath);

    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isDeleted: false, deletedAt: null, lastUpdatedByUser: req.user.id , filePath: newFilePath},
      },
      { new: true },
    );
    if (!updatedDocument) {
      return res.status(404).json({ error: "Dokument koji menjate nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(updatedDocument);
  } catch (err) {
    logger.error("Error restore document:", err)
    res.status(500).json({ error: "Greška prilikom povratka dokumenta.", code: "GENERIC_ERROR" });
  }
});

//DELETE only available from recycle bin
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;

    const deletedDocument = await collection.findByIdAndDelete(req.params.id);
    if (!deletedDocument) {
      return res.status(404).json({ error: "Dokument koji brišete nije pronadjen.", code: "NOT_FOUND" });
    }
    if (deletedDocument && deletedDocument.filePath) {
      try {
        const fileToDelete = path.join(getDmsCompanyFolderPath(companyFolder), deletedDocument.filePath);
        await deleteFile(fileToDelete);
      } catch (err) {
        throw err;
      }
    }
    res.status(200).json("Document has been deleted.");
  } catch (err) {
    logger.error("Error delete document:", err)
    res.status(500).json({ error: "Greška pri trajnom brisanju dokumenta!", code: "GENERIC_ERROR" });
  }
});

//GET
router.get("/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const document = await collection.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Dokument nije pronađen.", code: "NOT_FOUND" });
    }
    res.status(200).json(document);
  } catch (err) {
    logger.error("Error get document:", err)
    res.status(500).json({ error: "Greška pri traženju dokumenta.", code: "GENERIC_ERROR" });
  }
});

//GET ALL wih query params
router.get("/", verifyToken, async (req, res) => {
  const queryParams = {
    category: req.query.category,
    tag: req.query.tag,
    startdate: req.query.startdate,
    enddate: req.query.enddate,
    name: req.query.name,
    expired: req.query.expired,
    sortOrder: req.query.sortOrder,
    sortBy: req.query.sortBy,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 12
};
    try {
      const collection = req.collection;
      let documents;
      let count;

      const { query, sortOptions } = generateQueryAndSortOptions(queryParams);

        count = await collection.countDocuments(query);
        
        const page = queryParams.page;
        const limit = queryParams.limit;
        documents = await collection.find(query)
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("category");
    
          res.status(200).json({
            page,
            limit,
            totalDocuments: count,
            totalPages: Math.ceil(count / limit),
            data: documents,
          });
      
      } catch (err) {
				logger.error("Error get all documents:", err)
        res.status(500).json({ error: "Greška pri traženju dokumenata.", code: "GENERIC_ERROR" });
      }
  });

	//GET ALL from recycle bin
router.get("/recycle/all", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    let documents;
    documents = await collection.find({ isDeleted: true }).sort({
      //createdAt: -1,
      originDate: -1,
    });

    res.status(200).json(documents);
  } catch (err) {
    logger.error("Error get all documents from recycle bin:", err)
    res.status(500).json({ error: "Greška pri traženju dokumenata iz obrisanih.", code: "GENERIC_ERROR" });
  }
});

//download single file, /file/:id bilo ,ali dodati query da bi radilo posao i za folder sadrzaj download/preview
router.get("/file/download", verifyToken, async (req, res) => {
  const { id, folderId, fileName } = req.query;
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;
    let filePath;

    if (id) {
      const document = await collection.findById(id);
      if (!document) {
        throw new CustomError('Dokument nije pronađen.', "NOT_FOUND");
      }
      filePath = path.join( getDmsCompanyFolderPath(companyFolder), document.filePath);
    } else if (folderId && fileName) {
      const folderDocument = await collection.findById(folderId);
      if (!folderDocument) {
        throw new CustomError('Dokument foldera nije pronađen.', "NOT_FOUND");
      }
      const folderPath = path.join( getDmsCompanyFolderPath(companyFolder), folderDocument.filePath);
      filePath = path.join(folderPath, fileName);
    } else {
      throw new CustomError('Loši parametri.', "BAD_PARAMETERS");
    }

    if (!fs.existsSync(filePath)) {
      throw new CustomError('Nije pronadjen fajl.', "FILE_NOT_FOUND");
    }

    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    readStream.on('error', (err) => {
      throw err;
    });

  } catch (err) {
    if (err instanceof CustomError) {
      res.status(400).json({ error: err.message, code: err.code });
    } else{
      logger.error("Error file download:", err)
      res.status(500).json({ error: "Greška prilikom preuzimanja fajla.", code: "GENERIC_ERROR" });
    }
  }
});
//download folder
router.get("/folder/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;
    const document = await collection.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Dokument nije pronađen.", code: "NOT_FOUND" });
    }

    const folderPath = path.join( getDmsCompanyFolderPath(companyFolder), document.filePath);

    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(folderPath)}.zip"`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    });

    archive.on('error', (err) => {
      throw err;
    });

    // Pipe the archive to the response
    archive.pipe(res);

    // Append files from the folder to the archive
    archive.directory(folderPath, false);

    // Finalize the archive (this will send the file)
    archive.finalize();

  } catch (err) {
    logger.error("Error folder download:", err)
    res.status(500).json({ error: "Greška prilikom preuzimanja foldera.", code: "GENERIC_ERROR" });
  }
});

router.get("/folder-contents/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;
    const document = await collection.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Dokument nije pronađen.", code: "NOT_FOUND" });
    }
    const folderPath = path.join( getDmsCompanyFolderPath(companyFolder), document.filePath);

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        throw err;
      }

      // Map file names to their full paths
      //msm da se path ne koristi
      const fileDetails = files.map(file => {
        return {
          name: file,
          path: path.join(folderPath, file)
        };
      });

      res.status(200).json(fileDetails);
    });
  } catch (err) {
    logger.error("Error folder content:", err)
    res.status(500).json({ error: "Greška prilikom pregleda foldera.", code: "GENERIC_ERROR" });
  }
});

//IMPORT JSON disabled for now
router.post("/import/json", verifyToken, (req, res) => {
  //console.log(req.body);
  /*
  insertMany() ends up as one atomic insertMany() command that Mongoose sends to the MongoDB server, 
  but CREATE () ends up as a bunch of separate insertOne() calls
  INSERT MANY
  Setting ordered: false in the insertMany will insert ALL documents that are possible and "skip" those that throw an error. 
  But when finished, the function itself will report/throw an error with all information on how many documents had been saved and how many not.
  */
	const collection = req.collection;
  collection.insertMany(req.body?.importjson, { ordered: false })
    .then((response) => {
      //console.log("saved to mongo db", response);
      res.status(200).json(response);
    })
    .catch((error) => {
      //return error even if skipped duplicate correctly
      console.log("error in saving to mongo db", error);
      res.status(500).json(error);
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

router.get("/generate/archivebook", verifyToken, async (req, res) => {
  const queryParams = {
    category: req.query.category,
    tag: req.query.tag,
    startdate: req.query.startdate,
    enddate: req.query.enddate,
    name: req.query.name,
    expired: false,
    sortOrder: req.query.sortOrder,
    sortBy: req.query.sortBy,
  };
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;
    const { query, sortOptions } = generateQueryAndSortOptions(queryParams);
    let documents;

      documents = await collection.find(query)
        .sort(sortOptions)
        .populate("category");

        const setting = await Setting.findOne({ name: 'brojSaglasnosti' });
        if (!setting) {
          return res.status(404).json({ error: "Broj saglasnosti nije pronađen.", code: "NOT_FOUND" });
        }
        const consentNumber = setting.value;

        const company = await Company.findById(req.companyId);
        if (!company) {
          return res.status(404).json({ error: "Kompanija nije pronađena.", code: "NOT_FOUND" });
        }
        const companyName = company.name;
  
        await generatePdf(documents, companyName, companyFolder, consentNumber, queryParams.startdate, queryParams.enddate, res);
    } catch (err) {
      logger.error("Error archive book:", err)
      res.status(500).json({ error: "Greška prilikom generisanja arhivske knjige.", code: "GENERIC_ERROR" });
    }
});

router.get("/generate/reportexpired", verifyToken, async (req, res) => {
  const queryParams = {
    category: req.query.category,
    tag: req.query.tag,
    startdate: req.query.startdate,
    enddate: req.query.enddate,
    name: req.query.name,
    expired: true,
    sortOrder: req.query.sortOrder,
    sortBy: req.query.sortBy,
  };
  try {
    const collection = req.collection;
    const companyFolder = req.companyfolder;

    const { query, sortOptions } = generateQueryAndSortOptions(queryParams);

     // Update documents that have expired in the meantime
     const now = new Date();
     await collection.updateMany({
      ...query,
      expired: false,
      keepDate: { $lte: now }
    }, {
      $set: { expired: true }
    });

    let documents;

      documents = await collection.find(query)
        .sort(sortOptions);
        //.populate("category");

        const setting = await Setting.findOne({ name: 'brojSaglasnosti' });
        if (!setting) {
          return res.status(404).json({ error: "Broj saglasnosti nije pronađen.", code: "NOT_FOUND" });
        }
        const consentNumber = setting.value;

        const company = await Company.findById(req.companyId);
        if (!company) {
          return res.status(404).json({ error: "Kompanija nije pronađena.", code: "NOT_FOUND" });
        }
        const companyName = company.name;

        //brisanje bezvrednih fajlova iz izvestaja
        const dmsPath = getDmsFolderPath();
        documents.forEach(async (document) => {
            const oldFilePath = document.filePath;
            const oldPath = path.join(getDmsCompanyFolderPath(companyFolder), oldFilePath);
            const directory = path.dirname(path.dirname(oldPath));
            const filename = path.basename(oldPath);

            let newFilePath = path.join('obrisani', filename);
            let newPath = path.join(directory, newFilePath);

            //da ne ispitujem da li postoje u recyclebin, nego ako postoje preimenuj ih u unique tako sto dodat datetime
            if (fs.existsSync(newPath)) {
              const now = new Date();
              const formattedTimestamp = format(now, 'yyyyMMddHHmmss');
              const parsedPath = path.parse(newFilePath);
              newFilePath = path.join(parsedPath.dir, `${parsedPath.name}${formattedTimestamp}${parsedPath.ext}`);
              newPath = path.join(directory, newFilePath);
              //res.status(400).json({ error: "Fajl vec postoji medju privremeno obrisanima!", code: "FILE_EXISTS_IN_RECYCLE" });
            }

            await fs.promises.rename(oldPath, newPath);

            await collection.updateOne({ _id: document._id }, {
              $set: { isDeleted: true, deletedAt: new Date(), lastUpdatedByUser: req.user.id, filePath: newFilePath }
            });   
        }); 
        await generateExpiredReport(documents, companyName, companyFolder, consentNumber, queryParams.startdate, queryParams.enddate, res);         
    } catch (err) {
      logger.error("Error archive book:", err)
      res.status(500).json({ error: "Greška prilikom generisanja izvestaja bezvrednog materijala.", code: "GENERIC_ERROR" });
    }
});

const generateQueryAndSortOptions = (queryParams) => {
  const {
      category,
      tag,
      startdate,
      enddate,
      name,
      expired,
      sortOrder,
      sortBy
  } = queryParams;

  const query = {
    isDeleted: false,
    ...(expired !== null && expired !== undefined && { expired })
  };
  const sortOptions = {};

  if (category) {
      query.category = { $eq: new mongoose.Types.ObjectId(category) };
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
  if (name) {
      query.name = { $regex: name, $options: 'i' };
  }
  if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'true' ? -1 : 1;
  } else {
      //sortOptions.createdAt = -1;
      sortOptions.originDate = -1;
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
    if (Array.isArray(fields[key])) {
      const value = fields[key][fields[key].length - 1];
      if (value !== 'undefined' && value !== '') {
        result[key] = value === 'null' ? null : value;
      }
    }
  }
  return result;
};

const handleFileUploads = async (files, uploadDir, folderName) => {
  let totalSize = 0;
  let singleFilePath = null;
  let saveFolderPath = null;
  if (folderName){     
    saveFolderPath = path.join('otpremljeni',folderName);
    const createFolderPath = path.join(getDmsCompanyFolderPath(companyFolder), saveFolderPath);
    if (!fs.existsSync(createFolderPath)) {
      fs.mkdirSync(createFolderPath);
    } else {
      throw new CustomError("Ime foldera postoji. Ime foldera mora biti jedinstveno!", "FOLDERNAME_DUPLICATE");
    }
  }

  //bitno za update kod dokumenta koji nema fajl
  if (!files) {
    return { saveFolderPath, singleFilePath, totalSize }; // No files to process
  }

  const uploadedFiles = Array.isArray(files) ? files : [files];
  await Promise.all(uploadedFiles.map(async (file) => {
    const oldPath = file.filepath;
    singleFilePath = path.join('otpremljeni', file.originalFilename);
    const newPath = path.join(uploadDir, singleFilePath);

    if (fs.existsSync(newPath)) {
      throw new CustomError("Ime fajla postoji. Ime fajla mora biti jedinstveno.", "FILENAME_DUPLICATE");
    }

    await fs.promises.rename(oldPath, newPath);
    totalSize += file.size;
  }));

  return { saveFolderPath, singleFilePath, totalSize };
};

const validateFileSize = (expectedSize, totalSize) => {
  const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
  if (expectedSize !== '0' && totalSizeInMB !== expectedSize) {
    throw new CustomError('Velicina poslatog fajla se ne poklapa sa velicinom primljenog fajla.', "FILE_SIZE_MISMATCH");
  }
};

const handleError = (res, err, filePath, uploadDir) => {
  if (filePath) {
    try {
      fse.remove(path.join(uploadDir, filePath));
    } catch (deleteErr) {
      logger.error("Error deleting file/folder on failed operation:", deleteErr);
    }
  }

  if (err.code === 11000) {
    if (err.keyPattern?.name) {
      res.status(400).json({ error: "Naziv dokumenta postoji. Naziv dokumenta mora biti jedinstven!", code: "NAME_DUPLICATE" });
    } else if (err.keyPattern?.filePath) {
      res.status(400).json({ error: "Ime fajla postoji. Ime fajla mora biti jedinstveno!", code: "FILENAME_DUPLICATE" });
    }
  } else if (err instanceof CustomError) {
    res.status(400).json({ error: err.message, code: err.code });
  } else {
    logger.error("Error:", err);
    res.status(500).json({ error: "Greška prilikom obrade.", code: "GENERIC_ERROR" });
  }
};

module.exports = router;