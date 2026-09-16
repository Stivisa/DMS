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

function buildDocumentDefinition(tableBody, companyName, consentNumber, title) {
  return {
    pageOrientation: "landscape",
    pageMargins: [35, 65, 35, 35],
    pageSize: "A4",
    header: {
      margin: [0, 15],
      columns: [
        {
          stack: [
            { text: title, alignment: "center", style: "header" },
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

function savePdfAndRespond(documentDefinition, companyFolder, filename, res) {
  const pdfDoc = printer.createPdfKitDocument(documentDefinition);
  const filePath = path.join(getDmsReportFolderPath(companyFolder), filename);
  const fileStream = fs.createWriteStream(filePath);
  pdfDoc.pipe(fileStream);
  pdfDoc.end();
  fileStream.on("finish", () => {
    res.json({ folder: companyFolder, filename });
  });
}

function generateDocumentRows(documents, fullPath) {
  return documents.map((item) => {
    const maxKeepPeriodCategory = item.categories.reduce(
      (maxCategory, currentCategory) => {
        const currentKeepPeriod =
          currentCategory.keepYears === 0 && currentCategory.keepMonths === 0
            ? Infinity
            : (currentCategory.keepYears || 0) * 12 +
              (currentCategory.keepMonths || 0);
        const maxKeepPeriod =
          maxCategory.keepYears === 0 && maxCategory.keepMonths === 0
            ? Infinity
            : (maxCategory.keepYears || 0) * 12 +
              (maxCategory.keepMonths || 0);
        return currentKeepPeriod > maxKeepPeriod ? currentCategory : maxCategory;
      },
      { keepYears: -1, keepMonths: -1 },
    );
    return [
      { text: item.serialNumber + ".", style: "row", alignment: "center" },
      {
        text: format(new Date(item.createdAt), "dd.MM.yyyy"),
        style: "row",
        alignment: "center",
      },
      { text: item.yearStart || "", style: "row", alignment: "center" },
      { text: item.yearEnd || "", style: "row", alignment: "center" },
      {
        text: item.categories
          .map((category) => category.label || category.serialNumber + ".")
          .join(","),
        style: "row",
        alignment: "center",
      },
      { text: item.content, style: "row", alignment: "center" },
      {
        text: item.fileSize !== "0" ? item.fileSize + " MB" : item.quantity,
        style: "row",
        alignment: "center",
      },
      {
        text: item.filePath
          ? fullPath + "\\" + item.filePath
          : item.physicalLocation,
        style: "row",
      },
      { text: "", style: "row" },
      {
        text: getKeepPeriodText(maxKeepPeriodCategory),
        style: "row",
        alignment: "center",
      },
      { text: item.note || "", style: "row" },
    ];
  });
}

// ── Archive documents report (per document) ───────────────────────────────────

async function generateArchiveDocumentsReport(
  documents,
  companyName,
  companyFolder,
  consentNumber,
  res,
) {
  const dmsPath = getDmsFolderPath();
  const fullPath = path.join(dmsPath, companyFolder);
  const slicedPath = fullPath.slice(3);

  const body = [
    ...buildTableHeader(),
    ...generateDocumentRows(documents, slicedPath),
  ];

  const documentDefinition = buildDocumentDefinition(
    body,
    companyName,
    consentNumber,
    "IZVEŠTAJ ARHIVIRANIH DOKUMENATA",
  );
  const filename = `izvestaj_arhiviranih_dokumenata_${format(new Date(), "ddMMyyyy_HHmmss")}.pdf`;
  savePdfAndRespond(documentDefinition, companyFolder, filename, res);
}

// ── Expired documents report (per document) ───────────────────────────────────

async function generateExpiredDocumentsReport(
  documents,
  companyName,
  companyFolder,
  consentNumber,
  res,
) {
  const dmsPath = getDmsFolderPath();
  const fullPath = path.join(dmsPath, companyFolder);
  const slicedPath = fullPath.slice(3);

  const body = [
    ...buildTableHeader(),
    ...generateDocumentRows(documents, slicedPath),
  ];

  const documentDefinition = buildDocumentDefinition(
    body,
    companyName,
    consentNumber,
    "IZVEŠTAJ BEZVREDNIH DOKUMENATA",
  );
  const filename = `izvestaj_bezvrednih_dokumenata_${format(new Date(), "ddMMyyyy_HHmmss")}.pdf`;
  savePdfAndRespond(documentDefinition, companyFolder, filename, res);
}

module.exports = {
  generateArchiveDocumentsReport,
  generateExpiredDocumentsReport,
};
