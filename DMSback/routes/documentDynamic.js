const mongoose = require("mongoose");
const {
  getDmsFolderPath,
  deleteFile,
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
const Setting = require("../models/Setting");

router.use(async (req, res, next) => {
  const companyFolder = req.headers?.companyfolder;
  const companyId = req.headers?.companyid;
  //console.log(collectionName);
  if (!companyFolder) {
      return res.status(400).json('Company collection/folder name not provided in headers.');
  }
  const collectionName = `firma_${companyId}`;
	req.collectionName = collectionName;
  req.companyfolder = companyFolder;
  //req.collection = mongoose.connection.collection(collectionName);
	const temp = await createDocumentDuplicateModel(collectionName);
	//req.collection = mongoose.model(collectionName, Document.schema);
	//req.collection = mongoose.models[collectionName];
	//console.log(temp);
	//console.log(mongoose.modelNames());
	req.collection = temp;
	//console.log(DocumentModel);
  next();
});

// CREATE
// POST endpoint for uploading folder/file and form data
router.post('/', verifyTokenAndAdmin, async (req, res) => {
	const collection = req.collection;
	const companyFolder = req.companyfolder;
  const form = new formidable.IncomingForm();
  form.multiples = true; // Allow multiple file uploads
  form.uploadDir = path.join(getDmsFolderPath(), companyFolder, 'otpremljeni'); // Temp directory for uploads
  const result = {};
  let saveFolderPath;
    form.parse(req, async (err, fields, files) => {
        //console.log('fields: ', fields);
        //console.log('files: ', files);
        if (err) {
          return res.status(500).json(err.message);
        }
        try{                 
            for (const key in fields) {
              //fields[key].length === 1, bude vece jer form data na frontu appenduje, problem kod uzastopnih submmitova (kad server vraca gresku)
              //if (Array.isArray(fields[key]) && fields[key].length === 1) { const value = fields[key][0];
                if (Array.isArray(fields[key])) { 
                const value = fields[key][fields[key].length - 1];
                if (value !== 'undefined' && value !== '') {
                  result[key] = value;
                }
              } 
            }
            const folderName = fields.folderName ? fields.folderName[0] : null;
            if (folderName){     
              //saveFolderPath = path.join(collectionName, folderName);
              saveFolderPath = folderName;
              const createFolderPath = path.join(getDmsFolderPath(), companyFolder, saveFolderPath);
              if (!fs.existsSync(createFolderPath)) {
                fs.mkdirSync(createFolderPath);
              } else {
                throw new Error(`Postoji folder sa ovim imenom.`);
              }
            }
            let totalSize = 0;
            let singleFilePath = '';
            if (files.files) {
              // Handle single and multiple file uploads
              const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
              uploadedFiles.forEach(async file => {
                const oldPath = file.filepath;
                //file.originalFilename za fajl je samo fajl, dok za fajlove foldera je 'folder/filename'
                const newPath = path.join(getDmsFolderPath(), companyFolder, file.originalFilename);
                //singleFilePath = newPath;
                //singleFilePath = path.join(companyFolder, file.originalFilename);
                singleFilePath = file.originalFilename;
                totalSize += file.size;
                await fs.promises.rename(oldPath, newPath)
              });
            }
            result.filePath = folderName ? saveFolderPath : singleFilePath;
            const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
            if (totalSizeInMB !== result.fileSize) {
              throw new Error('Velicina poslatog fajla se ne poklapa sa velicinom primljenog fajla.');
            }
            const newDocument = new collection(result);
            newDocument.createdByUser = req.user.id;
            savedDocument = await newDocument.save();

            res.status(200).json(savedDocument);      
        }catch(err){
          if (result.filePath) {
            try {
              fse.remove(result.filePath);
            } catch (deleteErr) {
              console.error("Error deleting folder:", deleteErr);
            }
          }
          if (err.code === 11000) { // MongoDB duplicate key error
            if (err.keyPattern.name) {
              err.message = "Naziv dokumenta postoji. Naziv dokumenta mora biti jedinstven!";
            } else if (err.keyPattern.filePath) {
              err.message = "Ime fajla postoji. Ime fajla mora biti jedinstveno!";
            }     
          }
          res.status(510).json(err.message);
        }
    });
});

//UPDATE
router.put("/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    Object.keys(req.body.requestBody).forEach(key => {
      if (req.body.requestBody[key] === "") {
        req.body.requestBody[key] = null;
      }
    });
  
    req.body.requestBody.lastUpdatedByUser = req.user.id;
    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body.requestBody,
      },
      { new: true },
    );
    res.status(200).json(updatedDocument);
  } catch (err) {
    res.status(500).json(err);
  }
});

//RECYCLE to recycle bin, set isDeleted to true
router.put("/recycle/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;
    const dmsPath = getDmsFolderPath();

    oldFilePath = req.body.filePath;
    const oldPath = path.join(dmsPath, companyFolder, oldFilePath);
    const directory = path.dirname(oldPath);
    const filename = path.basename(oldPath);

    newFilePath = path.join('obrisani', filename);
    const newPath = path.join(directory, 'obrisani', filename);
    if (fs.existsSync(newPath)) {
      throw new Error("Fajl vec postoji medju privremeno obrisanima!");
    }
    await fs.promises.rename(oldPath, newPath);

    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isDeleted: true, deletedAt: new Date(), lastUpdatedByUser: req.user.id , filePath: newFilePath},
      },
      { new: true },
    );
    res.status(200).json(updatedDocument);
  } catch (err) {
    res.status(510).json(err.message);
  }
});

//RESTORE from recycle bin, set isDeleted to false
router.put("/restore/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;
    const dmsPath = getDmsFolderPath();

    oldFilePath = req.body.filePath;
    const oldPath = path.join(dmsPath, companyFolder, oldFilePath);
    const directory = path.dirname(path.dirname(oldPath));
    const filename = path.basename(oldPath);

    newFilePath = filename;
    const newPath = path.join(directory, filename);
    if (fs.existsSync(newPath)) {
      throw new Error("Fajl vec postoji medju trenutnim dokumentima!");
    }

    await fs.promises.rename(oldPath, newPath);

    //req.body.lastUpdatedByUser = req.user.id;
    const updatedDocument = await collection.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isDeleted: false, deletedAt: null, lastUpdatedByUser: req.user.id , filePath: newFilePath},
      },
      { new: true },
    );
    res.status(200).json(updatedDocument);
  } catch (err) {
    res.status(510).json(err.message);
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;
    await collection.findByIdAndDelete(req.params.id).then(
      async (deletedDocument) => {
        if (deletedDocument.filePath) {
          try {
            const fileToDelete = path.join(getDmsFolderPath(), companyFolder, deletedDocument.filePath);
            await deleteFile(fileToDelete);
          } catch (err) {
            throw err;
          }
        }
      },
    );
    res.status(200).json("Document has been deleted.");
  } catch (err) {
    res.status(510).json(err.message);
  }
});

//GET
router.get("/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const document = await collection.findById(req.params.id);
    res.status(200).json(document);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL wih query params
//za prikaz koristimo pagination, za archive book potrebni svi podaci
//ako menjas ovo treba i get /generate/archivebook
router.get("/", verifyToken, async (req, res) => {
  const queryParams = {
    category: req.query.category,
    tag: req.query.tag,
    startdate: req.query.startdate,
    enddate: req.query.enddate,
    name: req.query.name,
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
				console.log(err.message)
        res.status(500).json(err);
      }
  });

	//GET ALL from recycle bin
router.get("/recycle/all", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    let documents;
    documents = await collection.find({ isDeleted: true }).sort({
      createdAt: -1,
    });

    res.status(200).json(documents);
  } catch (err) {
    res.status(500).json(err);
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
      // Fetch file by document ID
      const document = await collection.findById(id);
      //filePath = document.filePath;
      filePath = path.join( getDmsFolderPath(), companyFolder, document.filePath);
    } else if (folderId && fileName) {
      // Fetch file within a folder
      const folderDocument = await collection.findById(folderId);
      //const folderPath = folderDocument.filePath;
      const folderPath = path.join( getDmsFolderPath(), companyFolder, folderDocument.filePath);
      filePath = path.join(folderPath, fileName);
    } else {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    readStream.on('error', (err) => {
      console.error("Error reading file:", err);
      res.status(510).json("Error reading file");
    });

  } catch (err) {
    res.status(510).json(err);
  }
});
//download folder
router.get("/folder/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;
    const document = await collection.findById(req.params.id);

    const folderPath = path.join( getDmsFolderPath(), companyFolder, document.filePath);

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
    console.error("Error creating ZIP file:", err);
    res.status(500).json({ message: "Error creating ZIP file" });
  }
});

router.get("/folder-contents/:id", verifyToken, async (req, res) => {
  try {
		const collection = req.collection;
    const companyFolder = req.companyfolder;
    const document = await collection.findById(req.params.id);
    //const folderPath = document.filePath;
    const folderPath = path.join( getDmsFolderPath(), companyFolder, document.filePath);

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error("Error reading folder:", err);
        return res.status(500).json({ message: "Error reading folder" });
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
    console.error("Error finding document:", err);
    res.status(500).json({ message: "Error finding document" });
  }
});

//IMPORT JSON
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
        /*
        if (!setting) {
          throw new Error({ error: "Broj saglasnosti nije pronađen.", code: "NOT_FOUND" });
        }
        */
        const consentNumber = setting.value;
  
        await generatePdf(documents, companyFolder, consentNumber, queryParams.startdate, queryParams.enddate, res);
    } catch (err) {
      console.log(err.message)
      res.status(500).json(err);
    }
});

const generateQueryAndSortOptions = (queryParams) => {
  const {
      category,
      tag,
      startdate,
      enddate,
      name,
      sortOrder,
      sortBy
  } = queryParams;

  const query = { isDeleted: false };
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
      query.createdAt = { $gte: startDate, $lte: endDate };
  }
  if (name) {
      query.name = { $regex: name, $options: 'i' };
  }
  if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'true' ? -1 : 1;
  } else {
      sortOptions.createdAt = -1;
  }

  return { query, sortOptions };
};

module.exports = router;