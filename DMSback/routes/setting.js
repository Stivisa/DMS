const Setting = require("../models/Setting");
const { verifyToken } = require("../middlewares/verifyToken");
const checkDiskSpace = require("check-disk-space").default;
const InvalidPathError = require("check-disk-space").InvalidPathError;
const {
  getDmsFolderPath,
} = require("../utils/storage");
const logger = require("../middlewares/logger");
const { cloneOrUpdateRepo } = require("../utils/update");

const router = require("express").Router();

//GET setting by name
router.get("/:name", verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findOne({ name: req.params.name });
    if (!setting) {
      return res.status(404).json({ error: "Podešavanje nije pronađeno " + req.params.name, code: "NOT_FOUND" });
    }
    res.status(200).json(setting);
  } catch (err) {
    logger.error("Error get setting by name - " + req.params.name + " :", err)
    res.status(500).json({ error: "Greška pri trazenju podešavanja " + req.params.name, code: "GENERIC_ERROR" });
  }
});

//put consent number , uvek ce biti prisutan zbog seed
router.put("/consentnumber", verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { name: 'brojSaglasnosti' },
      { value: req.body.value }, // Postavljamo vrednost polja na vrednost koja je poslata u zahtevu
      { new: true }
    );
    if (!setting) {
      return res.status(404).json({ error: "Podešavanje koje menjate, broj saglasnosti nije pronađeno.", code: "NOT_FOUND" });
    }
    res.status(200).json(setting);
  } catch (err) {
    logger.error("Error edit consent number:", err)
    res.status(500).json({ error: "Greška pri izmeni broja saglasnosti.", code: "GENERIC_ERROR" });
  }
});

//GET disk free space
router.get("/storage/free", verifyToken, async (req, res) => {
  try {
      const diskPath = getDmsFolderPath();
      /*
      checkDiskSpace(diskPath).then((diskSpace) => {
        let gbFree = (diskSpace.free / (1024 * 1024 * 1024)).toFixed(1);
        let gbSize = (diskSpace.size / (1024 * 1024 * 1024)).toFixed(1);
        res.status(200).json({ gbFree, gbSize });
      });
      */
      const diskSpace = await checkDiskSpace(diskPath);
      const gbFree = (diskSpace.free / (1024 * 1024 * 1024)).toFixed(1);
      const gbSize = (diskSpace.size / (1024 * 1024 * 1024)).toFixed(1);
      res.status(200).json({ gbFree, gbSize });
  } catch (err) {
    if (err instanceof InvalidPathError) { 
      return res.status(400).json({ error: "Putanja diska nije pronadjena!", code: "DISK_PATH_NOT_FOUND" });
    } else{
      logger.error("Error check disk space:", err)
      res.status(500).json({ error: "Greška prilikom provere prostora diska.", code: "GENERIC_ERROR" });
    }
  }
});

router.get('/update/app', async (req, res) => {
  try {
    await cloneOrUpdateRepo();
    res.status(200).send('Repository checked and updated if necessary.');
  } catch (error) {
    res.status(500).send('Error updating repository: ' + error.message);
  }
});


module.exports = router;
