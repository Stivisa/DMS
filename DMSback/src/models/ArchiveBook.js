const mongoose = require("mongoose");

const ArchiveBookRowSchema = new mongoose.Schema(
  {
    serialNumber: { type: Number },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryLabel: { type: String },
    categoryName: { type: String },
    yearStart: { type: Number },
    yearEnd: { type: Number },
    keepPeriod: { type: String },
    quantity: { type: String },
    location: { type: String },
    latestDate: { type: Date },
    napomena: { type: String },
  },
  { _id: false },
);

const ExpiredRowSchema = new mongoose.Schema(
  {
    serialNumber: { type: Number },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryLabel: { type: String },
    categoryName: { type: String },
    yearStart: { type: Number },
    keepPeriod: { type: String },
    quantity: { type: String },
    archiveBookSerialNumber: { type: Number },
  },
  { _id: false },
);

const ArchiveBookSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    year: { type: Number, required: true },

    // Arhivska knjiga
    startNumber: { type: Number },
    endNumber: { type: Number },
    pdfPath: { type: String },
    rows: [ArchiveBookRowSchema],

    // Bezvredni materijal
    expiredStartNumber: { type: Number },
    expiredEndNumber: { type: Number },
    expiredPdfPath: { type: String },
    expiredRows: [ExpiredRowSchema],

    // Zajednički lock
    lockedAt: { type: Date, default: null },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Soft delete
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "archive_books" },
);

ArchiveBookSchema.index(
  { companyId: 1, year: 1 },
  { unique: true, partialFilterExpression: { deleted: { $eq: false } } },
);

module.exports = mongoose.model("ArchiveBook", ArchiveBookSchema);
