import React, { useCallback, useEffect, useState } from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { FiBookOpen } from "react-icons/fi";
import { IoDocument } from "react-icons/io5";
import { FaArrowAltCircleRight, FaArrowAltCircleLeft  } from "react-icons/fa";
import {
  BiSolidDownArrowAlt,
  BiSolidUpArrowAlt,
  BiImport,
  BiExport,
} from "react-icons/bi";
import { userRequest } from "../../utils/requestMethods";
import {
  handleRequestErrorAlert,
} from "../../utils/errorHandlers";
import DeleteModal from "../../components/modal/DeleteModal";
import { useNavigate, Link } from "react-router-dom";
import fileDownload from "js-file-download";
import date from "date-and-time";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import Papa from "papaparse";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const Document = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentDelete, setSelectedDocumentDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [modalOnInfo, setModalOnInfo] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [sortCreatedAt, setSortCreatedAt] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [searchName, setSearchName] = useState('');

  const [consentNumber, setConsentNumber] = useState();

  var dateCopy = new Date();
  dateCopy.setHours(24, 0, 0, 0);
  const [endDate, setEndDate] = useState(dateCopy);
  dateCopy = new Date();
  dateCopy.setHours(0, 0, 0, 0);
  dateCopy.setMonth(dateCopy.getMonth() - 6);
  const [startDate, setStartDate] = useState(dateCopy);

  const navigate = useNavigate();

  const getDocuments = useCallback(
    async () => {
      if (startDate && endDate && startDate > endDate) {
        alert("Pocetni datum ne sme biti veci od krajnjeg.");
        return;
      } 
      const params = {
        page,
        limit,
        sortcreatedat : sortCreatedAt,
        ...(searchName ? { name: searchName } : {}),
        ...(startDate && endDate ? { startdate: startDate, enddate: endDate } : {})
      };
      try {     
        const response = await userRequest.get('documents', { params });
        setTotalPages(response.data.totalPages);
        setDocuments(response.data?.data);
      } catch (error) {
        handleRequestErrorAlert(error);
      }
    },
    [page,limit, searchName, startDate, endDate, sortCreatedAt],
  );

  const fetchDocumentsBook = useCallback(
    async () => {
      const archivebook = true;
      const params = {
        archivebook,
        sortcreatedat : sortCreatedAt,
        ...(searchName ? { name: searchName } : {}),
        ...(startDate && endDate ? { startdate: startDate, enddate: endDate } : {})
      };
      try {
        const response = await userRequest.get('documents', { params });    
        return response.data?.data;
      } catch (error) {
        handleRequestErrorAlert(error);
        return []; // Return an empty array in case of error
      }
    },
    [navigate, searchName, startDate, endDate, sortCreatedAt],
  );

  const handleNextPage = () => {
    setPage(prevPage => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setPage(prevPage => Math.max(prevPage - 1, 1));
  };
  
  // Function to update limit based on screen height
  const updateLimitBasedOnScreenHeight = () => {
    const screenHeight = window.innerHeight - 270;
    const itemHeight = 50; // Assuming each item's height as 80px, you can adjust this value based on your item design
    const maxItems = Math.floor(screenHeight / itemHeight);
    setLimit(maxItems);
  }
  
  useEffect(() => {
    // Call the function initially and on window resize
    updateLimitBasedOnScreenHeight();
    window.addEventListener('resize', updateLimitBasedOnScreenHeight);
    return () => window.removeEventListener('resize', updateLimitBasedOnScreenHeight);
  }, []);

  useEffect(() => {
    document.title = "DOKUMENTI";
    getDocuments();
  }, [
    getDocuments,
  ]);

  const deleteProduct = useCallback(async () => {
    if (selectedDocumentDelete) {
      await userRequest
          .put("documents/recycle/" + selectedDocumentDelete._id, {
            filePath: selectedDocumentDelete.filePath,
          }).then(() => {
            getDocuments();
          })
          .catch(function (error) {
            handleRequestErrorAlert(error);
          });
      setChoiceModalDelete(false);
    }
  }, [selectedDocumentDelete, getDocuments]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteProduct();
    }
  }, [choiceModalDelete, deleteProduct]);

  async function ExportToJson() {
    const archivebook = true;
    const params = {
      archivebook,
      sortcreatedat: sortCreatedAt,
      ...(searchName ? { name: searchName } : {}),
      ...(startDate && endDate ? { startdate: startDate, enddate: endDate } : {})
    };
  
    try {
      const response = await userRequest.get("documents", { 
        params: params, 
        responseType: "blob" 
      });
      const blob = response.data;
  
      // Read Blob as text
      const jsonData = await blob.text();
  
      // Prettify JSON data
      const jsonString = JSON.stringify(JSON.parse(jsonData), null, 2);
  
      // Convert JSON to CSV
      Papa.parse(jsonString, {
        complete: (result) => {
          const csvData = result.data;
          const csvString = Papa.unparse(csvData);
  
          // Download CSV file
          fileDownload(csvString, "documents.csv");
        },
        error: (error) => {
          handleRequestErrorAlert(error);
        }
      });
  
      // Download JSON file
      fileDownload(jsonString, "documents.json");
    } catch (error) {
      handleRequestErrorAlert(error);
    }
  }

  async function ImportJson(uploadedFile) {
    const fileReader = new FileReader();
    fileReader.onloadend = async () => {
      try {
        await userRequest
          .post("documents/import/json", {
            importjson: JSON.parse(fileReader.result),
          })
          .catch(function (error) {
            handleRequestErrorAlert(error);
          });
      } catch (e) {
        console.log("Not valid JSON file!");
      }
    };
    if (uploadedFile !== undefined) fileReader.readAsText(uploadedFile);
  }

  function sortingCreatedAt() {
    setSortCreatedAt(!sortCreatedAt);
    getDocuments();
  }

  const filterByName = (event) => {
    setSearchName(event.target.value.toLowerCase());
  };

  const getConsentNumber = async () => {
    await userRequest
      .get("settings/brojSaglasnosti")
      .then((response) => {
        setConsentNumber(response.data.value);
      })
      .catch(function (error) {
        handleRequestErrorAlert(error);
      });
  };

  async function generatePdf(startDate, endDate) {
    await getConsentNumber();
    const documentsBook = await fetchDocumentsBook();
    // Define the document content
    const documentDefinition = {
      pageOrientation: "landscape",
      pageMargins: [35, 35, 35, 35],
      pageSize: "A4",
      header: {
        margin: [0, 15],
        columns: [
          {
            text: `ARHIVSKA KNJIGA (${date.format(new Date(startDate), "DD.MM.YYYY ")} - ${date.format(new Date(endDate), "DD.MM.YYYY ")})`,
            alignment: 'center',
            style: "header",    
          }
        ]
      },
      content: [
        {
          table: {
            widths: [25, 51, 40, 60, 32, 70, 70, 80, 120, 51, 73],
            headerRows: 1,
            body: generateTableBody(documentsBook), //generateTableBody(data),
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
    try {
      pdfMake.createPdf(documentDefinition).open();
    } catch (error) {
      console.error("Greška prilikom generiranja PDF-a:", error);
    }
  }

  function generateTableBody(data) {
    const body = [];
    // Add header row
    body.push([
      { text: "Redni broj", style: "columnName" },
      { text: "Datum upisa", style: "columnName" },
      { text: "Godina nastanka", style: "columnName" },
      { text: "Sadržaj", style: "columnName" },
      { text: "Klasif. oznaka", style: "columnName" },
      { text: "Rok čuvanja iz liste kateg.", style: "columnName" },
      {
        text: "Broj saglasnosti na listu kateg.",
        style: "columnName",
      },
      { text: "Kolicina dok. materijala", style: "columnName" },
      {
        text: "Prostorije i police/uređaji za skladištenje sa lokacijom",
        style: "columnName",
      },
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
    data.forEach((item) => {
      body.push([
        { text: item.serialNumber, style: "row" },
        {
          text: date.format(new Date(item.createdAt), "DD.MM.YYYY"),
          style: "row",
        },
        { text: item.yearStart, style: "row" },
        { text: item.content, style: "row" },
        { text: item.category?.label || "", style: "row" },
        { text: item.category?.keepPeriod ? item.category.keepPeriod + " meseci" : "", style: "row" },
        { text: consentNumber, style: "row" },
        { text: item.fileSize ? item.fileSize + " MB" : "", style: "row" },
        { text: item.filePath?.split(":\\").pop() || "DMS", style: "row" },
        { text: "", style: "row" },
        { text: "", style: "row" },
      ]);
    });
    return body;
  }

  return (
    <div className="bg-gray-300 px-2">
      <div className="w-full  p-1 border rounded-lg bg-white">
        <div className=" w-full flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl px-2 font-bold">DOKUMENTI</h1>
            <Link to="/documents/new">
              <button className="text-white bg-purple-800 p-2 rounded-md">
                Dodaj novi dokument
              </button>
            </Link>
          </div>
          <div className="flex items-center">
            <button
              className="flex text-white bg-purple-800 p-1 rounded-md items-center"
              onClick={() => generatePdf(startDate, endDate)}
            >
              <FiBookOpen title="Arhivska knjiga" className="mr-1"/> ARHIVSKA KNJIGA
            </button>
            <BiExport
              className="text-purple-800 text-2xl cursor-pointer"
              onClick={() => ExportToJson()}
              title="Izvezi podatke"
            />
            <label title="Uvezi podatke">
              <BiImport className="text-purple-800 text-2xl cursor-pointer" />
              <input
                className="hidden"
                type="file"
                accept=".json,application/json"
                disabled
                //multiple
                onChange={(e) => ImportJson(e.target.files[0])}
              />
            </label>
            <p
              onClick={() => {
                setModalOnInfo(true);
              }}
              className="m-1 cursor-pointer"
              title="Informacije"
            >
              <BsInfoCircle className="text-purple-800 text-2xl" />
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full p-3 border rounded-lg bg-white items-center">
        <div>
          <label className="text-md font-medium mr-1">Naziv:</label>
          <input
            id="search-box"
            placeholder="Filter naziv"
            className=" shadow border rounded px-2 py-1 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
            onChange={filterByName}
          />
        </div>
        <div className="flex">
          <label className="ml-2 mr-1 text-md font-medium">Period:</label>
          <DatePicker
            className="border w-24 cursor-pointer"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="dd/MM/yyyy"
          />
          <label className="mx-1 text-md font-bold">-</label>
          <DatePicker
            className="border w-24"
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="dd/MM/yyyy"
          />
        </div>
      </div>
      <div className="px-2 grid md:grid-cols-3 sm:grid-cols-3 grid-cols-2 items-center justify-between cursor-pointer">
        <div
          className="flex px-12"
        >
          <span className="font-bold">Naziv</span>
        </div>
        <div
          className="flex"
          onClick={() => {
            sortingCreatedAt();
          }}
        >
          <span className="hidden sm:grid font-bold">Kreirano</span>
          {sortCreatedAt ? (
            <BiSolidDownArrowAlt className="text-purple-800 text-2xl" />
          ) : (
            <BiSolidUpArrowAlt className="text-purple-800 text-2xl" />
          )}
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-270px)]">
        <ul>
          {documents.map((document, id) => (
            <li
              key={id}
              className="bg-white hover:bg-gray-50 rounded-lg border p-1 grid md:grid-cols-3 sm:grid-cols-3 grid-cols-2 items-center justify-between cursor-pointer"
              onDoubleClick={() => navigate(`/documents/edit/${document._id}`)}
            >
              <div className="flex items-center">
                <div className="bg-purple-300 p-3 rounded-lg">
                  <IoDocument className="text-purple-800" />
                </div>
                <p className="pl-4">{document.name}</p>
              </div>
              <p className="hidden sm:flex">
                {date.format(new Date(document.createdAt), "HH:mm DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <Link to={"/documents/edit/" + document._id}>
                  <p className={"bg-blue-300 p-3 ml-1 rounded-lg"}>
                    <AiFillEdit title="Edit" />
                  </p>
                </Link>
                <p
                  className={"bg-red-300 p-3 ml-1 rounded-lg"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedDocumentDelete(document);
                  }}
                >
                  <AiFillDelete title="Delete" className="text-red-800" />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center">
        <button className="p-2" onClick={handlePreviousPage} disabled={page === 1}><FaArrowAltCircleLeft className="text-purple-800 text-2xl" /></button>
        <span className="mx-2">
         Strana {page} od {totalPages}</span>
        <button className="p-2" onClick={handleNextPage} disabled={page === totalPages}><FaArrowAltCircleRight className="text-purple-800 text-2xl" /></button>
      </div>
      {modalOnDelete && (
        <DeleteModal
          setModalOn={setModalOnDelete}
          setChoice={setChoiceModalDelete}
          modalMessage={`Da li želite obrisati dokument: ${selectedDocumentDelete.name}?`}
        />
      )}
      {modalOnInfo && (
        <div
          onClick={() => {
            setModalOnInfo(false);
          }}
          className="fixed w-full h-screen z-10 top-0 left-0"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="max-w-md rounded-lg shadow-lg bg-gray-200 border-2 flex fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 "
          >
            <div className="w-full">
              <div className="flex flex-col justify-center text-center mt-0 px-4 py-4">
                <h1 className="text-2xl">POMOĆ</h1>
                <div className="flex justify-center items-center">
                  <p className={"bg-blue-200 p-3 rounded-lg"}>
                    <AiFillEdit title="Edit" />
                  </p>
                  Izmeni dokument
                </div>
                <div className="flex justify-center items-center mt-1">
                  <p className={"bg-red-200 p-3 rounded-lg"}>
                    <AiFillDelete title="Delete" className="text-red-800" />
                  </p>
                  Obriši dokument
                </div>
                <div className="justify-center items-center mt-1">
                  <div className="font-medium">PERIOD filter</div>{" "}
                  <div>
                    - uključujući početni datum, ne uključuje krajnji
                    <br />- brisanje oba datuma, vraća sva dokumenta
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Document;
