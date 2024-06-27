import React, { useCallback, useEffect, useState } from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { FiBookOpen } from "react-icons/fi";
import { ImArrowLeft, ImArrowRight  } from "react-icons/im";
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
import Papa from "papaparse";
import InfoModal from "../../components/modal/InfoModal";
//import SearchFilter from "../../components/SearchFilter";

const DocumentDynamic = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentDelete, setSelectedDocumentDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [modalOnInfo, setModalOnInfo] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [searchName, setSearchName] = useState('');

  var dateCopy = new Date();
  //dateCopy.setHours(24, 0, 0, 0);
  const [endDate, setEndDate] = useState(dateCopy);
  dateCopy = new Date();
  dateCopy.setHours(0, 0, 0, 0);
  dateCopy.setMonth(dateCopy.getMonth() - 12);
  const [startDate, setStartDate] = useState(dateCopy);

  const navigate = useNavigate();

  const getParams = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      alert("Pocetni datum ne sme biti veci od krajnjeg.");
      return;
    }
    const params = {
      page,
      limit,
      sortBy,
      sortOrder,
      ...(searchName ? { name: searchName } : {}),
      ...(startDate && endDate ? { startdate: startDate, enddate: endDate } : {})
    };
    return params;
  }, [page, limit, searchName, startDate, endDate, sortBy, sortOrder]);

  const getDocuments = useCallback(
    async () => {
       
      const params = getParams();
      try {     
        const response = await userRequest.get('document', { params });
        setTotalPages(response.data.totalPages);
        setDocuments(response.data?.data);
      } catch (error) {
        handleRequestErrorAlert(error);
      }
    },
    [getParams],
  );

  const getArchiveBook = useCallback(
    async (preview) => {
      const params = getParams();
      try {
        const response = await userRequest.get('document/generate/archivebook', { params , responseType: 'blob', });  
        if(preview){
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const dataUrl = URL.createObjectURL(blob);
        
          window.open(dataUrl, "_blank");
        
          // Clean up the object URL after some time
          setTimeout(() => {
            URL.revokeObjectURL(dataUrl);
          }, 10000); // Adjust the time as necessary
        } else {
          const blob = new Blob([response.data], { type: response.headers['content-type'] });
          const downloadUrl = window.URL.createObjectURL(blob);
          const downloadLink = document.createElement("a");

          const filename = `arhivska_knjiga_${date.format(new Date(), 'DDMMYYYY')}.pdf`;
      
          downloadLink.href = downloadUrl;
          downloadLink.download = filename;
          downloadLink.click();
      
          window.URL.revokeObjectURL(downloadUrl); // Clean up
        }
      } catch (error) {
        handleRequestErrorAlert(error);
        return []; // Return an empty array in case of error
      }
    },
    [getParams],
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
          .put("document/recycle/" + selectedDocumentDelete._id, {
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
      ...(searchName ? { name: searchName } : {}),
      ...(startDate && endDate ? { startdate: startDate, enddate: endDate } : {})
    };
  
    try {
      const response = await userRequest.get("document", { 
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
          .post("document/import/json", {
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
    setSortBy('createdAt');
    setSortOrder(!sortOrder);
    getDocuments();
  }

  function sortingName() {
    setSortBy('name');
    setSortOrder(!sortOrder);
    getDocuments();
  }

  const filterByName = (event) => {
    setSearchName(event.target.value.toLowerCase());
  };

  const sectionsInfo = [
    {
      icon: <AiFillEdit size={20} title="Izmeni" />,
      text: "Izmeni dokument",
      buttonClass: "edit"
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši dokument",
      buttonClass: "delete"
    },
    {
      header : "Pretraga po datumu",
      text: "uključujući oba datuma. Brisanje bilo kog datuma, vraća sva dokumenta"
    }
  ];

  const updateApp = useCallback(
    async () => {
      try {     
        await userRequest.get('settings/update/app');
      } catch (error) {
        console.log(error)
      }
    },
    [],
  );

  return (
    <>
      <div className="px-2 py-1 border-2 border-gray-400 rounded-lg bg-white">
      <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
          <h1 className="text-xl text-color font-bold">DOKUMENTI1</h1>
            <Link to="/document/new">
              <button className="button-basic ml-1">
                Dodaj novi dokument
              </button>
            </Link>
          </div>
          <div className="flex items-center">
          <button
              className="button-default flex items-center"
              onClick={() => updateApp()}
            >
              <FiBookOpen title="Arhivska knjiga"/> AZURIRAJ
            </button>
          <button
              className="button-default flex items-center"
              onClick={() => getArchiveBook(true)}
            >
              <FiBookOpen title="Arhivska knjiga"/> PREGLEDAJ ARHIVU
            </button>
            <button
              className="button-default flex items-center mx-1"
              onClick={() => getArchiveBook(false)}
            >
              <FiBookOpen title="Arhivska knjiga"/> PREUZMI ARHIVU
            </button>
            <p
              onClick={() => ExportToJson()}
              className="cursor-pointer"
            >
              <BiExport  title="Izvezi podatke" className="text-color text-2xl" />
            </p>
            <label title="Uvezi podatke">
              <BiImport className="text-color text-2xl cursor-pointer" />
              <input
                className="hidden"
                type="file"
                accept=".json,application/json"
                //disabled
                //multiple
                onChange={(e) => ImportJson(e.target.files[0])}
              />
            </label>
            <p
              onClick={() => {
                setModalOnInfo(true);
              }}
              className="cursor-pointer"
            >
              <BsInfoCircle  title="Informacije" className="text-color text-2xl" />
            </p>
          </div>
        </div>
      </div>
      <div className="w-full px-2 p-1 border rounded-lg bg-white flex items-center">
        <h1 className="text-lg text-color font-semibold">Pretraga:</h1>
        <div className="flex items-center">
          <input
            id="search-box"
            placeholder="Filter naziv"
            className="input-field ml-1"
            onChange={filterByName}
          />
        </div>
        <div className="flex ml-1">
          <DatePicker
            className="border-2 border-gray-300 w-24 cursor-pointer"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="dd/MM/yyyy"
          />
          <label className="mx-1 text-md text-color font-bold">-</label>
          <DatePicker
            className="border-2 border-gray-300 w-24 cursor-pointer"
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="dd/MM/yyyy"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center justify-between pl-2">
        <div>
          <span className={
            sortBy === 'name'
              ? 'inline-flex font-semibold text-teal-400 cursor-pointer'
              : 'inline-flex font-semibold text-gray-800 cursor-pointer'
          }
          onClick={() => {
            sortingName();
          }}>
          Naziv
          { sortBy === 'name' && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
          </span>
        </div>
        <div>
          <span className={
            sortBy === 'createdAt'
              ? 'inline-flex font-semibold text-teal-400 cursor-pointer'
              : 'inline-flex font-semibold text-gray-800 cursor-pointer'
          }
          onClick={() => {
            sortingCreatedAt();
          }}
          >Kreirano
          {sortBy === 'createdAt' && !sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
          </span>
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-230px)]">
        <ul>
          {documents.map((document, id) => (
            <li
              key={id}
              className="bg-white hover:bg-gray-50 rounded-lg border p-1 pl-2 grid grid-cols-3 items-center justify-between cursor-pointer"
              onDoubleClick={() => navigate(`/document/edit/${document._id}`)}
            >    
              <p className="break-all">{document.name}</p>
              <p className="hidden sm:flex">
                {date.format(new Date(document.createdAt), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <Link to={"/document/edit/" + document._id}>
                  <button className={"button-edit"}>
                    <AiFillEdit size={20} title="Izmeni" />
                  </button>
                </Link>
                <button
                  className={"button-delete ml-1"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedDocumentDelete(document);
                  }}
                >
                  <AiFillDelete size={20} title="Obriši" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center">
        <button className="button-basic" onClick={handlePreviousPage} disabled={page === 1}><ImArrowLeft  size={20} /></button>
        <span className="mx-2 text-gray-800">
         Strana {page} od {totalPages}</span>
        <button className="button-basic" onClick={handleNextPage} disabled={page === totalPages}><ImArrowRight  size={20} /></button>
      </div>
      {modalOnDelete && (
        <DeleteModal
          setModalOn={setModalOnDelete}
          setChoice={setChoiceModalDelete}
          modalMessage={`Da li želite obrisati dokument: ${selectedDocumentDelete.name}?`}
        />
      )}
      {modalOnInfo && (
        <InfoModal
        onClose={() => setModalOnInfo(false)}
        sections={sectionsInfo}
      />
      )}
    </>
  );
};

export default DocumentDynamic;
