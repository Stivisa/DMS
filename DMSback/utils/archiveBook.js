const { format } = require('date-fns');
const { getDmsReportFolderPath } = require('./storage');
const path = require('path');
const fs = require('fs');

const PdfPrinter = require('pdfmake');
var fonts = {
    Roboto: {
        normal: 'node_modules/roboto-font/fonts/Roboto_condensed/robotocondensed-regular-webfont.ttf',
        bold: 'node_modules/roboto-font/fonts/Roboto/roboto-medium-webfont.ttf',
        italics: 'node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf',
        bolditalics: 'node_modules/roboto-font/fonts/Roboto/roboto-mediumitalic-webfont.ttf',
      }
 };
//pdfMake.vfs = pdfFonts.pdfMake.vfs;
const printer = new PdfPrinter(fonts);

async function generatePdf(documents, companyFolder, consentNumber, startDate, endDate, res) {
    const documentDefinition = {
      pageOrientation: "landscape",
      pageMargins: [35, 35, 35, 35],
      pageSize: "A4",
      header: {
        margin: [0, 15],
        columns: [
          {
            text: `ARHIVSKA KNJIGA (${format(new Date(startDate), 'dd.MM.yyyy')} - ${format(new Date(endDate), 'dd.MM.yyyy')})`,
            alignment: 'center',
            style: "header",
          }
        ]
      },
      content: [
        {
          table: {
            widths: [25, 47, 40, 60, 32, 70, 70, 80, 120, 55, 73],
            headerRows: 1,
            body: generateTableBody(documents, consentNumber),
          },
        },
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 2],
        },
        columnName: {
          bold: true,
          italics: true,
          fontSize: 10,
        },
        row: {
          fontSize: 10,
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
  
    const filename = `arhivska_knjiga_${format(new Date(), 'ddMMyyyy')}.pdf`;
    // Sačuvaj PDF na lokaciji
    const filePath = path.join(getDmsReportFolderPath(companyFolder), filename);

    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.end();

    // Slanje PDF fajla frontendu
    const chunks = [];
    let pdfBuffer = null;
    pdfDoc.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      pdfDoc.on('end', () => {
        pdfBuffer = Buffer.concat(chunks);
      
        // Postavljanje HTTP zaglavlja za slanje PDF fajla
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Slanje PDF fajla nazad kao odgovor na zahtev
        res.send(pdfBuffer);
      });
  }
  
  function generateTableBody(data, consentNumber) {
    const body = [];
    // Dodaj zaglavlje tabele
    body.push([
      { text: "Redni broj", style: "columnName" },
      { text: "Datum upisa", style: "columnName" },
      { text: "Godina nastanka", style: "columnName" },
      { text: "Sadržaj", style: "columnName" },
      { text: "Klasif. oznaka", style: "columnName" },
      { text: "Rok čuvanja iz liste kateg.", style: "columnName" },
      { text: "Broj saglasnosti na listu kateg.", style: "columnName" },
      { text: "Kolicina dok. materijala", style: "columnName" },
      { text: "Prostorije i police/uređaji za skladištenje sa lokacijom", style: "columnName" },
      { text: "Broj i datum zapisnika", style: "columnName" },
      { text: "Primedba", style: "columnName" },
    ]);

     // Add data rows
    /*
    data.forEach(item => {
      body.push([
        item.redniBroj,
        item.datumUpisa,
        item.godinaNastanka,
        item.sadrzaj,
        item.klasifikacionaOznaka,
        item.rokCuvanja,
        item.brojSaglasnosti,
        item.kolicinaDokumenata,
        item.prostorijePolica,
        item.brojDatumZapisnika,
        item.primedba,
      ]);
    });
    */
    
    // Dodaj podatke
    data.forEach((item) => {
      body.push([
        { text: item.serialNumber, style: "row" },
        { text: format(new Date(item.createdAt), 'dd.MM.yyyy'), style: "row" },
        { text: item.yearStart, style: "row" },
        { text: item.content, style: "row" },
        { text: item.category?.label || "", style: "row" },
        { text: item.category?.keepPeriod ? item.category.keepPeriod + " meseci" : "", style: "row" },
        { text: consentNumber || "", style: "row" },
        { text: item.fileSize ? item.fileSize + " MB" : "", style: "row" },
        { text: item.filePath?.split(":\\").pop() || "DMS", style: "row" },
        { text: "", style: "row" },
        { text: "", style: "row" },
      ]);
    });
    return body;
  }

  module.exports = {
    generatePdf,
  };
  