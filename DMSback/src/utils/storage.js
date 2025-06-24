const fs = require("node:fs");
const fse = require("fs-extra");
const path = require("path");

let dmsFolderPath;

const setDmsFolderPath = (disk) => {
  dmsFolderPath = path.join(disk + ":", "DMS");
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
const getDmsCompanyFolderPath = (companyFolder) => {
  const companyFolderPath = path.join(dmsFolderPath, companyFolder);
  return companyFolderPath;
};
const getDmsUploadFolderPath = (companyFolderPath) => {
  const uploadFolderPath = path.join(
    dmsFolderPath,
    companyFolderPath,
    "arhiva",
  );
  return uploadFolderPath;
};

const getDmsRecycleFolderPath = (companyFolderPath) => {
  const recycleFolderPath = path.join(
    dmsFolderPath,
    companyFolderPath,
    "obrisani",
  );
  return recycleFolderPath;
};

const getDmsReportFolderPath = (companyFolderPath) => {
  const reportFolderPath = path.join(
    dmsFolderPath,
    companyFolderPath,
    "izvestaji",
  );
  return reportFolderPath;
};

const createCompanyFolders = (companyFolderName) => {
  const companyFolderPath = path.join(dmsFolderPath, companyFolderName);
  const folders = [
    companyFolderPath,
    getDmsRecycleFolderPath(companyFolderName),
    getDmsUploadFolderPath(companyFolderName),
    getDmsReportFolderPath(companyFolderName),
  ];

  return Promise.all(
    folders.map((folder) => fse.mkdir(folder, { recursive: true })),
  ).catch((err) => {
    throw new Error(
      `Error creating folders for company ${companyFolderName}: ${err.message}`,
    );
  });
};

const deleteFile = async (filePath) => {
  try {
    //fse rekurzivno brise
    fse.remove(filePath);
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getDmsFolderPath,
  createCompanyFolders,
  deleteFile,
  setDmsFolderPath,
  getDmsCompanyFolderPath,
  getDmsUploadFolderPath,
  getDmsRecycleFolderPath,
  getDmsReportFolderPath,
};
