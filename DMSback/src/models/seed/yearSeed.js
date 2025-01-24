const mongoose = require("mongoose");
const Year = require("../Year");
const dotenv = require("dotenv");
const logger = require("../../middlewares/logger");

dotenv.config();

const seedYears = async () => {
  const elements = await Year.countDocuments();
  if (elements === 0) {
    const currentYear = new Date().getFullYear();
    const yearsToAdd = [];
    for (let year = 2000; year <= currentYear; year++) {
      yearsToAdd.push({ value: year });
    }
    await Year.insertMany(yearsToAdd);
    logger.info(`Seeded years from 2000 to ${currentYear}.`);
  }
};

const addNewYearIfNeeded = async () => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear;

  try {
    const exists = await Year.findOne({ value: nextYear });
    if (!exists) {
      await Year.create({ value: nextYear });
      logger.info(`Year ${nextYear} added to the database.`);
    }
  } catch (error) {
    logger.error(`Error adding year ${nextYear}:`, error);
  }
};

module.exports = {
  seedYears,
  addNewYearIfNeeded,
};