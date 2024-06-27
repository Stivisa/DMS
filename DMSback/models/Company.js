const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    folderName: { type: String, unique: true },
    //collectionName: { type: String, unique: true },
  },
  { timestamps: true, collection: "companies" },
);

module.exports = mongoose.model("Company", CompanySchema);
