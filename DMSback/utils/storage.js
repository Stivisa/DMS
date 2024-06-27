const fs = require("node:fs");
const fse = require('fs-extra');
const path = require("path");

let dmsFolderPath;

const setDmsFolderPath = (disk) => {
  dmsFolderPath = path.join(disk + ':', 'DMS');
  try {
    if (!fs.existsSync(dmsFolderPath)) {
      fse.mkdirSync(dmsFolderPath);
    }
  } catch (err) {
    throw new Error(`Error creating storage folder: ${err.message}`);
  }
};

const getDmsFolderPath = () => {
  return dmsFolderPath;
};

const getDmsUploadFolderPath = (companyFolderPath) => {
  const uploadFolderPath = path.join(dmsFolderPath, companyFolderPath, 'otpremljeni');
  return uploadFolderPath;
};

const getDmsRecycleFolderPath = (companyFolderPath) => {
  const recycleFolderPath = path.join(dmsFolderPath, companyFolderPath, 'obrisani');
  return recycleFolderPath;
};

const getDmsReportFolderPath = (companyFolderPath) => {
  const reportFolderPath = path.join(dmsFolderPath, companyFolderPath, 'izvestaji');
  return reportFolderPath;
};

//ne koristi a dynamic docs
/*
const initStorage = async () => {
  //dmsFolderPath = disk + ":/DMS";
  const dmsRecyclePath = path.join(dmsFolderPath, "obrisani");
  const dmsUploadPath = path.join(dmsFolderPath, "otpremljeni");
  try {
    if (!fs.existsSync(dmsFolderPath)) {
      await fse.mkdirSync(dmsFolderPath);
    }
    if (!fs.existsSync(dmsRecyclePath)) {
      await fse.mkdirSync(dmsRecyclePath);
    }
    if (!fs.existsSync(dmsUploadPath)) {
      await fse.mkdirSync(dmsUploadPath);
    }
  } catch (err) {
    throw new Error(`Error initializing storage: ${err.message}`);
  }
};
*/

const createCompanyFolders = (companyFolderName) => {
  const companyFolderPath = path.join(dmsFolderPath, companyFolderName);
  const recycleFolderPath = getDmsRecycleFolderPath(companyFolderName);
  const uploadFolderPath = getDmsUploadFolderPath(companyFolderName);
  const reportFolderPath = getDmsReportFolderPath(companyFolderName);

  try {
      if (!fs.existsSync(companyFolderPath)) {
          fs.mkdirSync(companyFolderPath);
      }
      if (!fs.existsSync(recycleFolderPath)) {
          fs.mkdirSync(recycleFolderPath);
      }
      if (!fs.existsSync(uploadFolderPath)) {
          fs.mkdirSync(uploadFolderPath);
      }
      if (!fs.existsSync(reportFolderPath)) {
          fs.mkdirSync(reportFolderPath);
      }
  } catch (err) {
      throw new Error(`Error creating folders for company ${companyFolderName}: ${err.message}`);
  }
};

const deleteFile = async (filePath) => {
  try {
    //fse rekurzivno brise
    fse.remove(filePath);
    //console.log(`File or folder '${filePath}' deleted successfully.`);
  } catch (err) {
    throw err;
  }
};

module.exports = {
  //initStorage,
  getDmsFolderPath,
  createCompanyFolders,
  deleteFile,
  setDmsFolderPath,
  getDmsUploadFolderPath,
  getDmsRecycleFolderPath,
  getDmsReportFolderPath,
};
