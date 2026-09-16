const router = require("express").Router();
const mongoose = require("mongoose");
const path = require("path");
const { format } = require("date-fns");

const companyCollectionMiddleware = require("../middlewares/companyCollectionMiddleware");
const {
  verifyTokenAndUser,
  verifyTokenAndSuperAdmin,
} = require("../middlewares/verifyToken");
const logger = require("../middlewares/logger");
const CustomError = require("../utils/CustomError");
const Setting = require("../models/Setting");
const Company = require("../models/Company");
const ArchiveBook = require("../models/ArchiveBook");
const { generateArchiveBookRowsOnly, generateArchiveBookPdf } = require("../utils/archiveBook");
const { generateExpiredData } = require("../utils/expiredReport");
const { getDmsReportFolderPath } = require("../utils/storage");
const { generateQueryAndSortOptions } = require("./documentDynamic");
const { auditLog } = require("../utils/auditLog");

router.use(companyCollectionMiddleware);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getCompanyAndSetting(companyId) {
  const [company, setting] = await Promise.all([
    Company.findById(companyId),
    Setting.findOne({ name: "brojSaglasnosti" }),
  ]);
  if (!company) throw new CustomError("Kompanija nije pronađena.", "NOT_FOUND");
  if (!setting) throw new CustomError("Broj saglasnosti nije pronađen.", "NOT_FOUND");
  return { companyName: company.name, consentNumber: setting.value };
}

function buildYearQueryParams(year, expired = false) {
  return {
    expired,
    startdate: new Date(year, 0, 1),
    enddate: new Date(year, 11, 31, 23, 59, 59),
  };
}

function getDocumentsForYear(collection, year) {
  const queryParams = buildYearQueryParams(year, false);
  const { query } = generateQueryAndSortOptions(queryParams);
  
  return collection
    .find(query)
    .sort({ serialNumber: 1 })
    .populate("categories");
}

function getExpiredDocumentsForYear(collection, year) {
  const queryParams = buildYearQueryParams(year, true);
  const { query } = generateQueryAndSortOptions(queryParams);
  
  return collection
    .find(query)
    .sort({ serialNumber: 1 })
    .populate("categories");
}

// ── GET / — list all records for company, sorted year desc ───────────────────

router.get("/", verifyTokenAndUser, async (req, res) => {
  try {
    const records = await ArchiveBook.find({ companyId: req.companyId, deleted: { $ne: true } })
      .sort({ year: -1 })
      .populate("lockedBy", "username")
      .populate("createdBy", "username")
      .populate("updatedBy", "username");
    return res.status(200).json(records);
  } catch (err) {
    logger.error("Error get archive books:", err);
    return res.status(500).json({ error: "Greška pri preuzimanju arhivske knjige.", code: "GENERIC_ERROR" });
  }
});

// ── POST / — create a new year record ────────────────────────────────────────

router.post("/", verifyTokenAndUser, async (req, res) => {
  const { year, startNumber } = req.body;
  const companyId = req.companyId;

  if (!year) {
    return res.status(400).json({ error: "Godina je obavezna.", code: "VALIDATION_ERROR" });
  }

  try {
    // If the immediately preceding year is locked, override startNumber with prevEndNumber + 1
    const prevYear = await ArchiveBook.findOne({ companyId, year: year - 1, lockedAt: { $ne: null } });
    const resolvedStartNumber = prevYear
      ? prevYear.endNumber + 1
      : startNumber != null ? Number(startNumber) : undefined;
    
    const resolvedExpiredStartNumber = prevYear && prevYear.expiredEndNumber != null
      ? prevYear.expiredEndNumber + 1
      : undefined;

    const record = await ArchiveBook.create({
      companyId,
      year: Number(year),
      ...(resolvedStartNumber != null && { startNumber: resolvedStartNumber }),
      expiredStartNumber: resolvedExpiredStartNumber,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "CREATE",
      resource: "ArchiveBook",
      resourceId: record._id,
      resourceName: String(record.year),
      endpoint: req.originalUrl,
      status: 201,
    });
    return res.status(201).json(record);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Zapis za ovu godinu već postoji.", code: "DUPLICATE_YEAR" });
    }
    logger.error("Error create archive book:", err);
    return res.status(500).json({ error: "Greška pri kreiranju arhivske knjige.", code: "GENERIC_ERROR" });
  }
});

// ── PUT /:id — update startNumbers (only if not locked) ──────────────────────

router.put("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    const record = await ArchiveBook.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!record) return res.status(404).json({ error: "Zapis nije pronađen.", code: "NOT_FOUND" });
    if (record.lockedAt) return res.status(400).json({ error: "Godina je zaključana.", code: "LOCKED" });

    const { startNumber, expiredStartNumber } = req.body;
    const changes = {};
    if (startNumber !== undefined && Number(startNumber) !== record.startNumber) {
      changes.startNumber = { old: record.startNumber, new: Number(startNumber) };
    }
    if (expiredStartNumber !== undefined && Number(expiredStartNumber) !== record.expiredStartNumber) {
      changes.expiredStartNumber = { old: record.expiredStartNumber, new: Number(expiredStartNumber) };
    }
    if (startNumber !== undefined) record.startNumber = Number(startNumber);
    if (expiredStartNumber !== undefined) record.expiredStartNumber = Number(expiredStartNumber);
    record.updatedBy = req.user.id;

    await record.save();
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "UPDATE",
      resource: "ArchiveBook",
      resourceId: record._id,
      resourceName: String(record.year),
      endpoint: req.originalUrl,
      status: 200,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });
    return res.status(200).json(record);
  } catch (err) {
    logger.error("Error update archive book:", err);
    return res.status(500).json({ error: "Greška pri izmeni arhivske knjige.", code: "GENERIC_ERROR" });
  }
});

// ── POST /:id/generate/archive/rows — fetch docs, build rows, save (no PDF) ──

router.post("/:id/generate/archive/rows", verifyTokenAndUser, async (req, res) => {
  try {
    const record = await ArchiveBook.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!record) return res.status(404).json({ error: "Zapis nije pronađen.", code: "NOT_FOUND" });
    if (record.lockedAt) return res.status(400).json({ error: "Godina je zaključana.", code: "LOCKED" });

    const startNumber = req.body.startNumber !== undefined
      ? Number(req.body.startNumber)
      : record.startNumber;

    const documents = await getDocumentsForYear(req.collection, record.year);
    const { rows, endNumber } = await generateArchiveBookRowsOnly(documents, startNumber, record.rows);

    record.startNumber = startNumber;
    record.endNumber = endNumber;
    record.rows = rows;
    record.updatedBy = req.user.id;
    await record.save();

    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "UPDATE",
      resource: "ArchiveBook",
      resourceId: record._id,
      resourceName: `Arhivska knjiga ${record.year} - Generisani redovi`,
      endpoint: req.originalUrl,
      status: 200,
    });

    return res.status(200).json({ record, rows });
  } catch (err) {
    logger.error("Error generate archive rows:", err);
    return res.status(500).json({ error: "Greška pri generisanju redova.", code: "GENERIC_ERROR" });
  }
});

// ── POST /:id/generate/archive/pdf — generate PDF from stored rows + napomene ─

router.post("/:id/generate/archive/pdf", verifyTokenAndUser, async (req, res) => {
  try {
    const record = await ArchiveBook.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!record) return res.status(404).json({ error: "Zapis nije pronađen.", code: "NOT_FOUND" });
    if (record.lockedAt) return res.status(400).json({ error: "Godina je zaključana.", code: "LOCKED" });
    if (!record.rows || record.rows.length === 0)
      return res.status(400).json({ error: "Nema generisanih redova.", code: "NO_ROWS" });

    // Merge napomene from request body into stored rows
    const napomenaMap = new Map(
      (req.body.napomene || []).map((n) => [Number(n.serialNumber), n.napomena || ""])
    );
    record.rows.forEach((r) => {
      if (napomenaMap.has(r.serialNumber)) r.napomena = napomenaMap.get(r.serialNumber);
    });

    const { companyName, consentNumber } = await getCompanyAndSetting(req.companyId);
    const { pdfPath } = await generateArchiveBookPdf(record.rows, companyName, req.companyfolder, consentNumber);

    record.pdfPath = pdfPath;
    record.updatedBy = req.user.id;
    await record.save();

    const filename = path.basename(pdfPath);
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "UPDATE",
      resource: "ArchiveBook",
      resourceId: record._id,
      resourceName: `Arhivska knjiga ${record.year} - Generisan PDF: ${filename}`,
      endpoint: req.originalUrl,
      status: 200,
    });

    return res.status(200).json({ record, folder: req.companyfolder, filename });
  } catch (err) {
    if (err instanceof CustomError) {
      return res.status(404).json({ error: err.message, code: err.code });
    }
    logger.error("Error generate archive PDF:", err);
    return res.status(500).json({ error: "Greška pri generisanju PDF-a.", code: "GENERIC_ERROR" });
  }
});

// ── POST /:id/generate/expired ────────────────────────────────────────────────

router.post("/:id/generate/expired", verifyTokenAndUser, async (req, res) => {
  try {
    const record = await ArchiveBook.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!record) return res.status(404).json({ error: "Zapis nije pronađen.", code: "NOT_FOUND" });
    if (record.lockedAt) return res.status(400).json({ error: "Godina je zaključana.", code: "LOCKED" });

    const { companyName } = await getCompanyAndSetting(req.companyId);
    const documents = await getExpiredDocumentsForYear(req.collection, record.year);

    const startNumber = req.body.expiredStartNumber !== undefined
      ? Number(req.body.expiredStartNumber)
      : (record.expiredStartNumber || 1);

    const { pdfPath, rows, endNumber } = await generateExpiredData(
      documents,
      companyName,
      req.companyfolder,
      startNumber,
      req.companyId,
      ArchiveBook,
    );

    record.expiredStartNumber = startNumber;
    record.expiredEndNumber = endNumber;
    record.expiredPdfPath = pdfPath;
    record.expiredRows = rows;
    record.updatedBy = req.user.id;
    await record.save();

    const filename = path.basename(pdfPath);
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "UPDATE",
      resource: "ArchiveBook",
      resourceId: record._id,
      resourceName: `Bezvredni materijal ${record.year} - Generisan izveštaj: ${filename}`,
      endpoint: req.originalUrl,
      status: 200,
    });

    return res.status(200).json({ record, folder: req.companyfolder, filename });
  } catch (err) {
    if (err instanceof CustomError) {
      return res.status(404).json({ error: err.message, code: err.code });
    }
    logger.error("Error generate expired report:", err);
    return res.status(500).json({ error: "Greška pri generisanju bezvrednog materijala.", code: "GENERIC_ERROR" });
  }
});

// ── PUT /:id/lock ─────────────────────────────────────────────────────────────

router.put("/:id/lock", verifyTokenAndUser, async (req, res) => {
  try {
    const record = await ArchiveBook.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!record) return res.status(404).json({ error: "Zapis nije pronađen.", code: "NOT_FOUND" });
    if (record.lockedAt) return res.status(400).json({ error: "Godina je već zaključana.", code: "LOCKED" });

    record.lockedAt = new Date();
    record.lockedBy = req.user.id;
    record.updatedBy = req.user.id;
    await record.save();

    return res.status(200).json(record);
  } catch (err) {
    logger.error("Error lock archive book:", err);
    return res.status(500).json({ error: "Greška pri zaključavanju.", code: "GENERIC_ERROR" });
  }
});

// ── PUT /:id/unlock — superAdmin only ─────────────────────────────────────────

router.put("/:id/unlock", verifyTokenAndSuperAdmin, async (req, res) => {
  try {
    const record = await ArchiveBook.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!record) return res.status(404).json({ error: "Zapis nije pronađen.", code: "NOT_FOUND" });

    const previousLockedAt = record.lockedAt;
    record.lockedAt = null;
    record.lockedBy = null;
    record.updatedBy = req.user.id;
    await record.save();
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "UPDATE",
      resource: "ArchiveBook",
      resourceId: record._id,
      resourceName: String(record.year),
      endpoint: req.originalUrl,
      status: 200,
      changes: { lockedAt: { old: previousLockedAt, new: null } },
    });
    return res.status(200).json(record);
  } catch (err) {
    logger.error("Error unlock archive book:", err);
    return res.status(500).json({ error: "Greška pri otključavanju.", code: "GENERIC_ERROR" });
  }
});

// ── DELETE /:id — soft delete (only if not locked, admin/superAdmin) ──────────

router.delete("/:id", verifyTokenAndUser, async (req, res) => {
  try {
    if (!req.user.isAdmin && !req.user.superAdmin) {
      return res.status(403).json({ error: "Nemate dozvolu za brisanje.", code: "FORBIDDEN" });
    }
    const record = await ArchiveBook.findOne({ _id: req.params.id, companyId: req.companyId, deleted: { $ne: true } });
    if (!record) return res.status(404).json({ error: "Zapis nije pronađen.", code: "NOT_FOUND" });
    if (record.lockedAt) {
      return res.status(400).json({ error: "Zatvorena godina ne može biti obrisana.", code: "LOCKED" });
    }
    record.deleted = true;
    record.updatedBy = req.user.id;
    await record.save();
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      companyId: req.headers.companyid,
      companyName: req.headers.companyname,
      action: "DELETE",
      resource: "ArchiveBook",
      resourceId: record._id,
      resourceName: String(record.year),
      endpoint: req.originalUrl,
      status: 200,
    });
    return res.status(200).json({ message: "Zapis je obrisan." });
  } catch (err) {
    logger.error("Error delete archive book:", err);
    return res.status(500).json({ error: "Greška pri brisanju.", code: "GENERIC_ERROR" });
  }
});

module.exports = router;
