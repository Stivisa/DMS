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

async function generateExpiredReport(
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
          widths: [30, 300, 50, 100, 50, 50, 120], //680
          headerRows: 1,
          body: generateTableBody(documents, slicedPath),
        },
      },
      {
        stack: [
          {
            text: `U _______________ , dana ${format(new Date(), "dd.MM.yyyy.")} godine`,
            alignment: "left",
            fontSize: 10,
          },
          {
            text: `ČLANOVI KOMISIJE`,
            alignment: "right",
            fontSize: 10,
            margin: [0, 0, 0, 5],
          },
          {
            text: "_________________________",
            alignment: "right",
            margin: [0, 0, 0, 5],
          },
          {
            text: "_________________________",
            alignment: "right",
            margin: [0, 0, 0, 5],
          },
          {
            text: "_________________________",
            alignment: "right",
            margin: [0, 0, 0, 0],
          },
        ],
        margin: [0, 50, 0, 0], // Ensure space at the bottom of the page
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
      const footerElements = [
        {
          columns: [
            {
              text: `Strana ${currentPage} od ${pageCount}`,
              alignment: "center",
              fontSize: 10,
            },
          ],
        },
      ];

      return footerElements;
    },
  };

  const pdfDoc = printer.createPdfKitDocument(documentDefinition);

  const filename = `bezvredni_materijal_${format(new Date(), "ddMMyyyy_HHmmss")}.pdf`;
  // Sačuvaj PDF na lokaciji
  const filePath = path.join(getDmsReportFolderPath(companyFolder), filename);

  const fileStream = fs.createWriteStream(filePath);
    pdfDoc.pipe(fileStream);
    pdfDoc.end();
  
  
    fileStream.on("finish", () => {
      // Return the filename in the response
      res.json({ folder: companyFolder, filename: filename });
    });

  /*
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
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Slanje PDF fajla nazad kao odgovor na zahtev
    res.send(pdfBuffer);
  });
  */
}

function generateTableBody(data, fullPath) {
  const body = [];
  // Dodaj zaglavlje tabele
  body.push([
    { text: "Redni broj", style: "columnName" },
    { text: "Naziv materijala", style: "columnName" },
    { text: "Godina  nastanka", style: "columnName" },
    { text: "Rok čuvanja", style: "columnName" },
    { text: "Redni broj upisa arh. knj.", style: "columnName" },
    { text: "Red. br. iz liste kategorija", style: "columnName" },
    { text: "Količina broj registratora", style: "columnName" },
  ]);

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
  let counter = 1;
  // Dodaj podatke
  data.forEach((item) => {
    body.push([
      { text: counter + ".", style: "row", alignment: "center" },
      { text: item.content, style: "row", alignment: "center" },
      { text: item.yearStart || "", style: "row", alignment: "center" },
      {
        text:
          item.keepDate !== null
            ? item.keepDate.toLocaleDateString("en-GB")
            : "trajno",
        style: "row",
        alignment: "center",
      },
      { text: item.serialNumber + ".", style: "row", alignment: "center" },
      { text: item.categories.map((category) => category.serialNumber+".").join(','),
         style: "row", alignment: "center" },
      {
        text: item.fileSize !== "0" ? item.fileSize + " MB" : item.quantity,
        style: "row",
        alignment: "center",
      },
    ]);
    counter++;
  });
  return body;
}

module.exports = {
  generateExpiredReport,
};
