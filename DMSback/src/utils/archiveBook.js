const { format } = require("date-fns");
const { getDmsReportFolderPath, getDmsFolderPath } = require("./storage");
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
//pdfMake.vfs = pdfFonts.pdfMake.vfs;
const printer = new PdfPrinter(fonts);

async function generatePdf(
  documents,
  companyName,
  companyFolder,
  consentNumber,
  startDate,
  endDate,
  res,
) {
  const dmsPath = getDmsFolderPath();
  const fullPath = path.join(dmsPath, companyFolder);
  const slicedPath = fullPath.slice(3);
  const documentDefinition = {
    pageOrientation: "landscape",
    pageMargins: [35, 65, 35, 35],
    pageSize: "A4",
    header: {
      margin: [0, 15],
      columns: [
        {
          stack: [
            {
              text: `ARHIVSKA KNJIGA`,
              alignment: "center",
              style: "header",
            },
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
          widths: [25, 45, 40, 40, 50, 100, 70, 110, 70, 60, 60], //670
          headerRows: 2,
          body: generateTableBody(documents, slicedPath),
        },
      },
    ],
    styles: {
      header: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 0],
      },
      subheader: {
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 0],
      },
      subheader2: {
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 2],
      },
      columnName: {
        bold: true,
        italics: true,
        fontSize: 10,
        alignment: "center",
        margin: [0, 0, 0, 0],
      },
      row: {
        fontSize: 10,
        alignment: "center",
      },
    },
    footer: function (currentPage, pageCount) {
      return {
        text: `Strana ${currentPage} od ${pageCount}`,
        alignment: "center",
        fontSize: 10,
      };
    },
  };

  const pdfDoc = printer.createPdfKitDocument(documentDefinition);

  const filename = `arhivska_knjiga_${format(new Date(), "ddMMyyyy_HHmmss")}.pdf`;
  // Sačuvaj PDF na lokaciji
  const filePath = path.join(getDmsReportFolderPath(companyFolder), filename);

  /*
  //old solution saves file and sends it in response
  pdfDoc.pipe(fs.createWriteStream(filePath));
  pdfDoc.end();

  // Slanje PDF fajla frontendu
  const chunks = [];
  let pdfBuffer = null;
  pdfDoc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  pdfDoc.on("end", () => {
    pdfBuffer = Buffer.concat(chunks);

    // Postavljanje HTTP zaglavlja za slanje PDF fajla
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    // Slanje PDF fajla nazad kao odgovor na zahtev
    res.send(pdfBuffer);
  });
  */

  //new solution saves file and sends just the file name in response, 
  // because another document/preview/archivebook api will return actual file,
  //  for better file preview in new tab on frontend

  const fileStream = fs.createWriteStream(filePath);
  pdfDoc.pipe(fileStream);
  pdfDoc.end();


  fileStream.on("finish", () => {
    // Return the filename in the response
    res.json({ folder: companyFolder, filename: filename });
  });
}

function generateTableBody(data, fullPath) {
  const body = [];
  // Dodaj zaglavlje tabele
  body.push(
    [
      { text: "Redni broj", style: "row", rowSpan: 2 },
      { text: "Datum upisa", style: "row", rowSpan: 2 },
      { text: "dokumentarni materijal", style: "columnName", colSpan: 6 },
      {}, //prazna celija zbog spajanja
      {},
      {},
      {},
      {},

      {
        text: "Broj i datum zapisnika o uništavanju",
        style: "columnName",
        rowSpan: 2,
      },
      { text: "Rok čuvanja", style: "columnName", rowSpan: 2 },
      { text: "Napomena", style: "columnName", rowSpan: 2 },
    ],
    [
      {}, // Empty cell for first header row
      {},
      { text: "Godina nastanka/raspon", style: "columnName", colSpan: 2 },
      {},
      { text: "Klasifik. oznaka", style: "columnName" },
      { text: "Sadržaj (naziv dokumentacije)", style: "columnName" },
      { text: "Količina u jedinicama  čuvanja", style: "columnName" },
      { text: "Lokacija - prostorija i polica", style: "columnName" },
      {},
      {},
    ],
  );

  // Add data rows
  /*
    data.forEach(item => {
      body.push([
        item.redniBroj,
        item.datumUpisa,
        item.godinaNastanka,
        item.klasifikacionaOznaka,
        item.sadrzaj,
        item.kolicinaDokumenata,
        item.prostorijePolica,
        item.brojDatumZapisnika,
        item.rokCuvanja,
        item.napomena,
      ]);
    });
    */
  //let counter = 1;
  // Dodaj podatke
  data.forEach((item) => {
    const maxKeepPeriodCategory = item.categories.reduce(
      (maxCategory, currentCategory) => {
        const currentKeepPeriod =
          (currentCategory.keepYears === 0 && currentCategory.keepMonths === 0)
            ? Infinity // Special case: infinity
            : (currentCategory.keepYears || 0) * 12 +
              (currentCategory.keepMonths || 0);
        const maxKeepPeriod =
          (maxCategory.keepYears === 0 && maxCategory.keepMonths === 0)
            ? Infinity // Special case: infinity
            : (maxCategory.keepYears || 0) * 12 +
              (maxCategory.keepMonths || 0);
        return currentKeepPeriod > maxKeepPeriod ? currentCategory : maxCategory;
      },
      { keepYears: -1, keepMonths: -1 }, // Initialize maxCategory with default values
    );
    body.push([
      { text: item.serialNumber + ".", style: "row", alignment: "center" },
      {
        text: format(new Date(item.createdAt), "dd.MM.yyyy"),
        style: "row",
        alignment: "center",
      },
      { text: item.yearStart || "", style: "row", alignment: "center" },
      { text: item.yearEnd || "", style: "row", alignment: "center" },

      {
        text: item.categories.map((category) => category.label || category.serialNumber+".").join(','),
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
        text:
        maxKeepPeriodCategory.keepYears === 0 &&
        maxKeepPeriodCategory.keepMonths === 0
          ? "trajno"
          : maxKeepPeriodCategory.keepYears > 0 &&
              maxKeepPeriodCategory.keepMonths > 0
            ? `${maxKeepPeriodCategory.keepYears} god. ${maxKeepPeriodCategory.keepMonths} mes.`
            : maxKeepPeriodCategory.keepYears > 0
              ? `${maxKeepPeriodCategory.keepYears} god.`
              : maxKeepPeriodCategory.keepMonths > 0
                ? `${maxKeepPeriodCategory.keepMonths} mes.`
                : "",
        style: "row",
        alignment: "center",
      },
      { text: item.note || "", style: "row" },
    ]);
  });
  return body;
}

module.exports = {
  generatePdf,
};
