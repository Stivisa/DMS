const { format } = require("date-fns");
const { getDmsReportFolderPath } = require("./storage");
const path = require("path");
const fs = require("fs");

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

function buildDocumentDefinition(tableBody, companyName, consentNumber) {
  return {
    pageOrientation: "landscape",
    pageMargins: [35, 65, 35, 35],
    pageSize: "A4",
    header: {
      margin: [0, 15],
      columns: [
        {
          stack: [
            { text: `ARHIVSKA KNJIGA`, alignment: "center", style: "header" },
            {
              text: `DOKUMENTACIJA NASTALA RADOM`,
              alignment: "center",
              style: "subheader",
            },
            {
              text:
                `Privredno društvo ` +
                companyName +
                ` ( Saglasnost na listu br. ` +
                consentNumber +
                ` )`,
              alignment: "center",
              style: "subheader2",
            },
          ],
        },
      ],
    },
    content: [
      {
        table: {
          widths: [25, 45, 40, 40, 50, 100, 70, 110, 70, 60, 60],
          headerRows: 2,
          body: tableBody,
        },
      },
    ],
    styles: {
      header: { fontSize: 12, bold: true, margin: [0, 0, 0, 0] },
      subheader: { fontSize: 10, bold: true, margin: [0, 0, 0, 0] },
      subheader2: { fontSize: 10, bold: true, margin: [0, 0, 0, 2] },
      columnName: {
        bold: true,
        italics: true,
        fontSize: 10,
        alignment: "center",
        margin: [0, 0, 0, 0],
      },
      row: { fontSize: 10, alignment: "center" },
    },
    footer: function (currentPage, pageCount) {
      return {
        text: `Strana ${currentPage} od ${pageCount}`,
        alignment: "center",
        fontSize: 10,
      };
    },
  };
}

function buildTableHeader() {
  return [
    [
      { text: "Redni broj", style: "row", rowSpan: 2 },
      { text: "Datum upisa", style: "row", rowSpan: 2 },
      { text: "dokumentarni materijal", style: "columnName", colSpan: 6 },
      {}, {}, {}, {}, {},
      {
        text: "Broj i datum zapisnika o uništavanju",
        style: "columnName",
        rowSpan: 2,
      },
      { text: "Rok čuvanja", style: "columnName", rowSpan: 2 },
      { text: "Napomena", style: "columnName", rowSpan: 2 },
    ],
    [
      {}, {},
      { text: "Godina nastanka/raspon", style: "columnName", colSpan: 2 },
      {},
      { text: "Klasifik. oznaka", style: "columnName" },
      { text: "Sadržaj (naziv dokumentacije)", style: "columnName" },
      { text: "Količina u jedinicama  čuvanja", style: "columnName" },
      { text: "Lokacija - prostorija i polica", style: "columnName" },
      {}, {},
    ],
  ];
}

function getKeepPeriodText(category) {
  if (category.keepYears === 0 && category.keepMonths === 0) return "trajno";
  if (category.keepYears > 0 && category.keepMonths > 0)
    return `${category.keepYears} god. ${category.keepMonths} mes.`;
  if (category.keepYears > 0) return `${category.keepYears} god.`;
  if (category.keepMonths > 0) return `${category.keepMonths} mes.`;
  return "";
}

function savePdfToFile(documentDefinition, companyFolder) {
  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(documentDefinition);
    const filename = `arhivska_knjiga_${format(new Date(), "ddMMyyyy_HHmmss")}.pdf`;
    const filePath = path.join(getDmsReportFolderPath(companyFolder), filename);

    const fileStream = fs.createWriteStream(filePath);
    pdfDoc.pipe(fileStream);
    pdfDoc.end();

    fileStream.on("finish", () => resolve(filePath));
    fileStream.on("error", reject);
  });
}

// ── Per-category PDF ──────────────────────────────────────────────────────────

// Returns { tableRows, structuredRows, endNumber }
// tableRows   — pdfmake cell arrays
// structuredRows — plain objects for ArchiveBook.rows
// endNumber   — last assigned serial number
function buildCategoryRowData(documents, startNumber, existingRows = null) {
  // Preserve napomene from previous generation (matched by categoryId)
  const napomenaMap = new Map();
  if (existingRows) {
    existingRows.forEach((r) => {
      if (r.categoryId) napomenaMap.set(r.categoryId.toString(), r.napomena || "");
    });
  }

  // Group documents by category
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

  const tableRows = [];
  const structuredRows = [];
  let counter = startNumber;

  Array.from(categoryMap.values()).forEach(({ category, docs }) => {
    // Latest createdAt among docs in this category
    const latestDate = docs.reduce((max, doc) => {
      const d = new Date(doc.createdAt);
      return d > max ? d : max;
    }, new Date(0));

    // Min yearStart, max yearEnd (ignore null/undefined)
    const yearStartValues = docs.map((d) => d.yearStart).filter((y) => y != null);
    const yearEndValues = docs.map((d) => d.yearEnd).filter((y) => y != null);
    const minYearStart = yearStartValues.length > 0 ? Math.min(...yearStartValues) : "";
    const maxYearEnd = yearEndValues.length > 0 ? Math.max(...yearEndValues) : "";

    // Quantity: sum file sizes (MB) for digital + unique physical quantities
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

    // Location: "hard disk" if any digital + unique physical locations
    const hasDigital = docs.some((doc) => doc.filePath);
    const physicalLocations = new Set();
    docs.forEach((doc) => {
      if (!doc.filePath && doc.physicalLocation) {
        physicalLocations.add(doc.physicalLocation);
      }
    });
    const locationParts = [];
    if (hasDigital) locationParts.push("hard disk");
    physicalLocations.forEach((loc) => locationParts.push(loc));
    const locationStr = locationParts.join(", ");

    const keepPeriod = getKeepPeriodText(category);
    const serialNumber = counter++;
    const categoryId = category._id.toString();
    const napomena = napomenaMap.get(categoryId) || "";

    tableRows.push([
      { text: serialNumber + ".", style: "row", alignment: "center" },
      { text: format(latestDate, "dd.MM.yyyy"), style: "row", alignment: "center" },
      { text: minYearStart !== "" ? String(minYearStart) : "", style: "row", alignment: "center" },
      { text: maxYearEnd !== "" ? String(maxYearEnd) : "", style: "row", alignment: "center" },
      { text: category.label || category.serialNumber + ".", style: "row", alignment: "center" },
      { text: category.name || "", style: "row", alignment: "center" },
      { text: quantityStr, style: "row", alignment: "center" },
      { text: locationStr, style: "row" },
      { text: "", style: "row" },
      { text: keepPeriod, style: "row", alignment: "center" },
      { text: napomena, style: "row" },
    ]);

    structuredRows.push({
      serialNumber,
      categoryId: category._id,
      categoryLabel: category.label || (category.serialNumber != null ? category.serialNumber + "." : ""),
      categoryName: category.name || "",
      yearStart: minYearStart !== "" ? minYearStart : null,
      yearEnd: maxYearEnd !== "" ? maxYearEnd : null,
      keepPeriod,
      quantity: quantityStr,
      location: locationStr,
      latestDate,
      napomena,
    });
  });

  return { tableRows, structuredRows, endNumber: counter - 1 };
}

// Generates rows only (no PDF). Merges napomene from existingRows by categoryId.
async function generateArchiveBookRowsOnly(documents, startNumber, existingRows) {
  const { structuredRows, endNumber } = buildCategoryRowData(documents, startNumber, existingRows);
  return { rows: structuredRows, endNumber };
}

// Builds pdfmake rows from stored ArchiveBook.rows (for PDF-only regeneration)
function buildPdfTableRowsFromStored(storedRows) {
  return storedRows.map((r) => [
    { text: r.serialNumber + ".", style: "row", alignment: "center" },
    { text: r.latestDate ? format(new Date(r.latestDate), "dd.MM.yyyy") : "", style: "row", alignment: "center" },
    { text: r.yearStart != null ? String(r.yearStart) : "", style: "row", alignment: "center" },
    { text: r.yearEnd != null ? String(r.yearEnd) : "", style: "row", alignment: "center" },
    { text: r.categoryLabel || "", style: "row", alignment: "center" },
    { text: r.categoryName || "", style: "row", alignment: "center" },
    { text: r.quantity || "", style: "row", alignment: "center" },
    { text: r.location || "", style: "row" },
    { text: "", style: "row" },
    { text: r.keepPeriod || "", style: "row", alignment: "center" },
    { text: r.napomena || "", style: "row" },
  ]);
}

// Generates PDF from stored rows (with napomene already applied)
async function generateArchiveBookPdf(storedRows, companyName, companyFolder, consentNumber) {
  const pdfRows = buildPdfTableRowsFromStored(storedRows);
  const body = [...buildTableHeader(), ...pdfRows];
  const documentDefinition = buildDocumentDefinition(body, companyName, consentNumber);
  const pdfPath = await savePdfToFile(documentDefinition, companyFolder);
  return { pdfPath };
}

module.exports = {
  generateArchiveBookRowsOnly,
  generateArchiveBookPdf,
  getKeepPeriodText,
};
