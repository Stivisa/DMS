//NOT USING, OLD FILE
const mongoose = require("mongoose");
const checkDiskSpace = require("check-disk-space").default;
const Document = require("../models/Document");
const { getDmsFolderPath, deleteFile } = require("../utils/storage");
const {
  verifyToken,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");
const fs = require("node:fs");
const path = require("path");
const formidable = require("formidable");
const fse = require("fs-extra");
const router = require("express").Router();
const archiver = require("archiver");

// CREATE
// POST endpoint for uploading folder/file and form data
router.post("/", verifyTokenAndAdmin, async (req, res) => {
  const form = new formidable.IncomingForm();
  form.multiples = true; // Allow multiple file uploads
  form.uploadDir = path.join(getDmsFolderPath(), "otpremljeni"); // Temp directory for uploads
  const result = {};
  let saveFolderPath;
  form.parse(req, async (err, fields, files) => {
    //console.log('fields: ', fields);
    //console.log('files: ', files);
    if (err) {
      return res.status(500).json(err.message);
    }
    try {
      for (const key in fields) {
        if (Array.isArray(fields[key]) && fields[key].length === 1) {
          const value = fields[key][0];
          if (value !== "undefined" && value !== "") {
            result[key] = value;
          }
        }
      }
      const folderName = fields.folderName ? fields.folderName[0] : null;
      if (folderName) {
        saveFolderPath = folderName
          ? path.join(getDmsFolderPath(), folderName)
          : null;
        if (!fs.existsSync(saveFolderPath)) {
          fs.mkdirSync(saveFolderPath);
        } else {
          throw new Error(`Postoji folder sa ovim imenom.`);
        }
      }
      let totalSize = 0;
      let singleFilePath = "";
      if (files.files) {
        // Handle single and multiple file uploads
        const uploadedFiles = Array.isArray(files.files)
          ? files.files
          : [files.files];
        uploadedFiles.forEach((file) => {
          const oldPath = file.filepath;
          const newPath = path.join(getDmsFolderPath(), file.originalFilename);
          singleFilePath = newPath;
          totalSize += file.size;
          fs.rename(oldPath, newPath, function (err) {
            if (err) throw err;
          });
        });
      }
      result.filePath = folderName ? saveFolderPath : singleFilePath;
      const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      if (totalSizeInMB !== result.fileSize) {
        throw new Error(
          "Velicina poslatog fajla se ne poklapa sa velicinom primljenog fajla.",
        );
      }
      const newDocument = new Document(result);
      newDocument.createdByUser = req.user.id;
      savedDocument = await newDocument.save();

      res.status(200).json(savedDocument);
    } catch (err) {
      if (result.filePath) {
        try {
          fse.remove(result.filePath);
        } catch (deleteErr) {
          console.error("Error deleting folder:", deleteErr);
        }
      }
      if (err.code === 11000) {
        // MongoDB duplicate key error
        err.message = "Ime vec postoji. Ime mora biti jedinstveno!";
      }
      res.status(510).json(err.message);
    }
  });
});

//UPDATE
router.put("/:id", verifyToken, async (req, res) => {
  try {
    Object.keys(req.body.requestBody).forEach((key) => {
      if (req.body.requestBody[key] === "") {
        req.body.requestBody[key] = null;
      }
    });

    req.body.requestBody.lastUpdatedByUser = req.user.id;
    const updatedDocument = await Document.findByIdAndUpdate(
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
    oldPath = req.body.filePath;
    const directory = path.dirname(oldPath);
    const filename = path.basename(oldPath);
    const newPath = path.join(directory, "obrisani", filename);
    if (fs.existsSync(newPath)) {
      throw new Error("Fajl vec postoji medju privremeno obrisanima!");
    }
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        throw err;
      }
    });
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          lastUpdatedByUser: req.user.id,
          filePath: newPath,
        },
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
    oldPath = req.body.filePath;
    const directory = path.dirname(path.dirname(oldPath));
    const filename = path.basename(oldPath);
    const newPath = path.join(directory, filename);
    if (fs.existsSync(newPath)) {
      throw new Error("Fajl vec postoji medju trenutnim dokumentima!");
    }
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        throw err;
      }
    });

    //req.body.lastUpdatedByUser = req.user.id;
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          astUpdatedByUser: req.user.id,
          filePath: newPath,
        },
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
    await Document.findByIdAndDelete(req.params.id).then(
      async (deletedDocument) => {
        if (deletedDocument.filePath) {
          try {
            await deleteFile(deletedDocument.filePath);
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
    const document = await Document.findById(req.params.id); //.populate("tags");
    res.status(200).json(document);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL wih query params
//za prikaz koristimo pagination, za archive book potrebni svi podaci
router.get("/", verifyToken, async (req, res) => {
  const qCategory = req.query.category;
  const qTag = req.query.tag;
  const qStartDate = req.query.startdate;
  const qEndDate = req.query.enddate;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const qName = req.query.name;
  const qArchiveBook = req.query.archivebook;
  const qSortName = req.query.sortname;
  const qSortCreatedAt = req.query.sortcreatedat;
  try {
    let documents;
    const query = { isDeleted: false };
    let count;

    if (qCategory) {
      query.category = { $eq: new mongoose.Types.ObjectId(qCategory) };
    }
    if (qTag) {
      query.tags = { $in: [qTag] };
    }
    if (qStartDate && qEndDate) {
      const startDate = new Date(qStartDate);
      const endDate = new Date(qEndDate);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }
    if (qName) {
      query.name = { $regex: qName, $options: "i" }; // Case-insensitive regex search
    }

    const sortOptions = {};
    sortOptions.createdAt = qSortCreatedAt === "true" ? -1 : 1;
    sortOptions.name = qSortName === "true" ? -1 : 1;

    if (qArchiveBook === "true") {
      documents = await Document.find(query)
        .sort(sortOptions)
        .populate("category");

      res.status(200).json({
        data: documents,
      });
    } else {
      count = await Document.countDocuments(query);

      documents = await Document.find(query)
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
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL from recycle bin
router.get("/recycle/all", verifyToken, async (req, res) => {
  try {
    let documents;
    documents = await Document.find({ isDeleted: true }).sort({
      createdAt: -1,
    });

    res.status(200).json(documents);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/file/download", verifyToken, async (req, res) => {
  const { id, folderId, fileName } = req.query;

  try {
    let filePath;

    if (id) {
      // Fetch file by document ID
      const document = await Document.findById(id);
      filePath = document.filePath;
    } else if (folderId && fileName) {
      // Fetch file within a folder
      const folderDocument = await Document.findById(folderId);
      const folderPath = folderDocument.filePath;
      filePath = path.join(folderPath, fileName);
    } else {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`,
    );
    res.setHeader("Content-Type", "application/octet-stream");

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    readStream.on("error", (err) => {
      console.error("Error reading file:", err);
      res.status(510).json("Error reading file");
    });
  } catch (err) {
    res.status(510).json(err);
  }
});

router.get("/folder/:id", verifyToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    const folderPath = document.filePath; // Assuming you store the folder path in your document model

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(folderPath)}.zip"`,
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
    console.error("Error creating ZIP file:", err);
    res.status(500).json({ message: "Error creating ZIP file" });
  }
});

router.get("/folder-contents/:id", verifyToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    const folderPath = document.filePath;

    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error("Error reading folder:", err);
        return res.status(500).json({ message: "Error reading folder" });
      }

      // Map file names to their full paths
      const fileDetails = files.map((file) => {
        return {
          name: file,
          path: path.join(folderPath, file),
        };
      });

      res.status(200).json(fileDetails);
    });
  } catch (err) {
    console.error("Error finding document:", err);
    res.status(500).json({ message: "Error finding document" });
  }
});

//GET disk free space
router.get("/storage/free", verifyToken, async (req, res) => {
  let diskPath = getDmsFolderPath();
  try {
    if (diskPath) {
      checkDiskSpace(diskPath).then((diskSpace) => {
        let gbFree = (diskSpace.free / (1024 * 1024 * 1024)).toFixed(1);
        let gbSize = (diskSpace.size / (1024 * 1024 * 1024)).toFixed(1);
        res.status(200).json({ gbFree, gbSize });
      });
    } else {
      res.status(200).json({ gbFree: 0, gbSize: 0 });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//IMPORT JSON
router.post("/import/json", verifyToken, (req, res) => {
  console.log(req.body);
  /*
  insertMany() ends up as one atomic insertMany() command that Mongoose sends to the MongoDB server, 
  but CREATE () ends up as a bunch of separate insertOne() calls
  INSERT MANY
  Setting ordered: false in the insertMany will insert ALL documents that are possible and "skip" those that throw an error. 
  But when finished, the function itself will report/throw an error with all information on how many documents had been saved and how many not.
  */
  Document.insertMany(req.body?.importjson, { ordered: false })
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

module.exports = router;
