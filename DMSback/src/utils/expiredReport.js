const { format } = require("date-fns");
const { getDmsReportFolderPath, getDmsFolderPath } = require("./storage");
const path = require("path");
const fs = require("fs");
const { getKeepPeriodText } = require("./archiveBook");

const PdfPrinter = require("pdfmake");
var fonts = {
  Roboto: {
    normal:
      "node_modules/roboto-font/fonts/Roboto_condensed/robotocondensed-regular-webfont.ttf",
    bold: "node_modules/roboto-font/fonts/Roboto/roboto-medium-webfont.ttf",
    italics: "node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf",
    bolditalics:
      "node_modules/roboto-font/fonts/Roboto/roboto-mediumitalic-webfont.ttf",
  },
};
const printer = new PdfPrinter(fonts);

// ── Shared helpers ────────────────────────────────────────────────────────────

function buildExpiredDocumentDefinition(tableBody, companyName) {
  return {
    pageOrientation: "landscape",
    pageMargins: [35, 55, 35, 35],
    pageSize: "A4",
    header: {
      margin: [0, 15],
      columns: [
        {
          stack: [
            {
              text: `Popis bezvrednog dokumentarog materijala kome je rok čuvanja istekao`,
              alignment: "center",
              style: "header",
            },
            {
              text: `Privredno društvo ` + companyName,
              alignment: "center",
              style: "subheader",
            },
          ],
        },
      ],
    },
    content: [
      {
        table: {
          widths: [30, 300, 50, 100, 50, 50, 120],
          headerRows: 1,
          body: tableBody,
        },
      },
      {
        stack: [
          {
            text: `U _______________ , dana ${format(new Date(), "dd.MM.yyyy.")} godine`,
            alignment: "left",
            fontSize: 10,
          },
          { text: `ČLANOVI KOMISIJE`, alignment: "right", fontSize: 10, margin: [0, 0, 0, 5] },
          { text: "_________________________", alignment: "right", margin: [0, 0, 0, 5] },
          { text: "_________________________", alignment: "right", margin: [0, 0, 0, 5] },
          { text: "_________________________", alignment: "right", margin: [0, 0, 0, 0] },
        ],
        margin: [0, 50, 0, 0],
      },
    ],
    styles: {
      header: { fontSize: 12, bold: true, margin: [0, 0, 0, 0] },
      subheader: { fontSize: 10, bold: true, margin: [0, 0, 0, 0] },
      columnName: { bold: true, italics: true, fontSize: 10, alignment: "center", margin: [0, 0, 0, 0] },
      row: { fontSize: 10, alignment: "center" },
    },
    footer: function (currentPage, pageCount) {
      return {
        columns: [
          { text: `Strana ${currentPage} od ${pageCount}`, alignment: "center", fontSize: 10 },
        ],
      };
    },
  };
}

function buildTableHeader() {
  return [
    [
      { text: "Redni broj", style: "columnName" },
      { text: "Naziv materijala", style: "columnName" },
      { text: "Godina nastanka", style: "columnName" },
      { text: "Rok čuvanja", style: "columnName" },
      { text: "Redni broj upisa arh. knj.", style: "columnName" },
      { text: "Red. br. iz liste kategorija", style: "columnName" },
      { text: "Količina broj registratora", style: "columnName" },
    ],
  ];
}

function savePdfToFile(documentDefinition, companyFolder) {
  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(documentDefinition);
    const filename = `bezvredni_materijal_${format(new Date(), "ddMMyyyy_HHmmss")}.pdf`;
    const filePath = path.join(getDmsReportFolderPath(companyFolder), filename);
    const fileStream = fs.createWriteStream(filePath);
    pdfDoc.pipe(fileStream);
    pdfDoc.end();
    fileStream.on("finish", () => resolve(filePath));
    fileStream.on("error", reject);
  });
}

// Groups expired documents by category; returns { tableRows, structuredRows, endNumber }
// documents — expired docs (can be from any year)
// companyId — to query ArchiveBook
// ArchiveBookModel — mongoose model to fetch archive book rows by year
// startNumber — starting serial number for expired list
async function buildExpiredCategoryRowData(documents, startNumber, companyId, ArchiveBookModel) {
  const categoryMap = new Map();
  documents.forEach((doc) => {
    doc.categories.forEach((category) => {
      const categoryId = category._id.toString();
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, { category, docs: [] });
      }
      categoryMap.get(categoryId).docs.push(doc);
    });
  });

  const tableRows = [...buildTableHeader()];
  const structuredRows = [];
  let counter = startNumber;

  for (const { category, docs } of Array.from(categoryMap.values())) {
    const yearStartValues = docs.map((d) => d.yearStart).filter((y) => y != null);
    const minYearStart = yearStartValues.length > 0 ? Math.min(...yearStartValues) : null;

    // Look up serial number from the ArchiveBook of the year the documents were archived
    let archiveBookSerialNumber = null;
    if (minYearStart && ArchiveBookModel) {
      try {
        const archiveBook = await ArchiveBookModel.findOne({
          companyId,
          year: minYearStart,
        });
        if (archiveBook && archiveBook.rows) {
          const categoryId = category._id.toString();
          const foundRow = archiveBook.rows.find((r) => r.categoryId?.toString() === categoryId);
          if (foundRow) {
            archiveBookSerialNumber = foundRow.serialNumber;
          }
        }
      } catch (err) {
        console.error(`Error fetching ArchiveBook for year ${minYearStart}:`, err);
      }
    }

    let totalFileSizeMB = 0;
    const physicalQuantities = new Set();
    docs.forEach((doc) => {
      if (doc.filePath && doc.fileSize && doc.fileSize !== "0") {
        totalFileSizeMB += parseFloat(doc.fileSize) || 0;
      } else if (doc.quantity) {
        physicalQuantities.add(doc.quantity);
      }
    });
    const quantityParts = [];
    if (totalFileSizeMB > 0) quantityParts.push(totalFileSizeMB.toFixed(2) + " MB");
    physicalQuantities.forEach((q) => quantityParts.push(q));
    const quantityStr = quantityParts.join(", ");

    const keepPeriod = getKeepPeriodText(category);
    const serialNumber = counter++;
    const categoryLabel = category.serialNumber ? category.serialNumber + "." : "";

    tableRows.push([
      { text: serialNumber + ".", style: "row", alignment: "center" },
      { text: category.name || "", style: "row", alignment: "center" },
      { text: minYearStart !== null ? String(minYearStart) : "", style: "row", alignment: "center" },
      { text: keepPeriod, style: "row", alignment: "center" },
      { text: archiveBookSerialNumber ? archiveBookSerialNumber + "." : "", style: "row", alignment: "center" },
      { text: categoryLabel, style: "row", alignment: "center" },
      { text: quantityStr, style: "row", alignment: "center" },
    ]);

    structuredRows.push({
      serialNumber,
      categoryId: category._id,
      categoryLabel: category.serialNumber != null ? category.serialNumber + "." : "",
      categoryName: category.name || "",
      yearStart: minYearStart,
      keepPeriod,
      quantity: quantityStr,
      archiveBookSerialNumber,
    });
  }

  return { tableRows, structuredRows, endNumber: counter - 1 };
}

// ── Generates PDF + structured rows (does NOT call res) ───────────────────────

async function generateExpiredData(
  documents,
  companyName,
  companyFolder,
  startNumber,
  companyId,
  ArchiveBookModel,
) {
  const { tableRows, structuredRows, endNumber } = await buildExpiredCategoryRowData(
    documents,
    startNumber,
    companyId,
    ArchiveBookModel,
  );
  const documentDefinition = buildExpiredDocumentDefinition(tableRows, companyName);
  const pdfPath = await savePdfToFile(documentDefinition, companyFolder);
  return { pdfPath, rows: structuredRows, endNumber };
}

module.exports = {
  generateExpiredData,
};
