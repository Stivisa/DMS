import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { FaBookOpen } from "react-icons/fa6";
import { ImArrowLeft, ImArrowRight } from "react-icons/im";
import { IoMdAddCircle } from "react-icons/io";
import {
  BiSolidDownArrowAlt,
  BiSolidUpArrowAlt,
} from "react-icons/bi";
import { userRequest, BASE_URL } from "../../utils/requestMethods";
import { handleRequestErrorAlert } from "../../utils/errorHandlers";
import DeleteModal from "../../components/modal/DeleteModal";
import { useNavigate, Link } from "react-router-dom";
import date from "date-and-time";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import InfoModal from "../../components/modal/InfoModal";
import ErrorMessages from "../../components/ErrorMessages";
import LoadingModal from "../../components/modal/LoadingModal";
import CategorySelect from "../../components/CategorySelect";

const DocumentDynamic = () => {
  const [documents, setDocuments] = useState([]);
  const [categoriesAll, setCategoriesAll] = useState([]);
  const [searchCategory, setSearchCategory] = useState("");
  const [selectedDocumentDelete, setSelectedDocumentDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [modalOnDeleteExpired, setModalOnDeleteExpired] = useState(false);
  const [modalOnInfo, setModalOnInfo] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [choiceModalDeleteExpired, setChoiceModalDeleteExpired] = useState(false);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const [searchExpired, setSearchExpired] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [searchContent, setSearchContent] = useState("");

  const user = useSelector((state) => state.user.currentUser);
  const isAdmin = user && user.isAdmin;
  const superAdmin = user.superAdmin;

  const [loading, setLoading] = useState(false);
  const docsListMinusHeight = 235; // Height of the header and other elements above the document list

  const [errors, setErrors] = useState({});

  var dateCopy = new Date();
  //dateCopy.setHours(24, 0, 0, 0);
  const [searchEndDate, setSearchEndDate] = useState(dateCopy);
  dateCopy = new Date();
  dateCopy.setHours(0, 0, 0, 0);
  dateCopy.setMonth(dateCopy.getMonth() - 12);
  const [searchStartDate, setSearchStartDate] = useState(dateCopy);

  const navigate = useNavigate();

  const getParams = useCallback(() => {
    if (searchStartDate && searchEndDate && searchStartDate > searchEndDate) {
      alert("Pocetni datum ne sme biti veci od krajnjeg.");
      return;
    }
    const params = {
      page,
      limit,
      sortBy,
      sortOrder,
      expired: searchExpired,
      ...(searchCategory ? { category: searchCategory } : {}),
      ...(searchContent ? { content: searchContent } : {}),
      ...(searchStartDate && searchEndDate
        ? { startdate: searchStartDate, enddate: searchEndDate }
        : {}),
    };
    return params;
  }, [page, limit, searchContent, searchStartDate, searchEndDate, sortBy, sortOrder, searchExpired, searchCategory]);

  const getDocuments = useCallback(async () => {
    const params = getParams();
    try {
      let loadingTimeout = setTimeout(() => {
        setLoading(true); // Set loading state to true after 2 seconds
      }, 2000);
      const response = await userRequest.get("document", { params });
      clearTimeout(loadingTimeout);

      setTotalPages(response.data.totalPages);
      if ( response.data.totalPages === 0) {
        setTotalPages(1);
      }
      setDocuments(response.data?.data);
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    } finally {
      setLoading(false); // Set loading state to false
    }
  }, [getParams]);

  const getArchiveBook = useCallback(
    async () => {
      const params = getParams();
      try {
        let loadingTimeout = setTimeout(() => {
          setLoading(true); // Set loading state to true after 2 seconds
        }, 2000);
        const response = await userRequest.get(
          "document/generate/archivebook",
          { params},
        );
        clearTimeout(loadingTimeout);

         //previous solution worked with blob, but could not pass custom name
        const folder = response.data.folder;
        const filename = response.data.filename;
        const publicUrl = `${BASE_URL}document/preview/report/${filename}?folder=${folder}`;
        window.open(publicUrl, "_blank");
      } catch (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error});
      } finally {
        setLoading(false); // Set loading state to false
      }
    },
    [getParams],
  );

  //button removed, query by keepDate not expired flag
  /*
  const checkExpiredDocuments = useCallback(async () => {
    try {
      let loadingTimeout = setTimeout(() => {
        setLoading(true); // Set loading state to true after 2 seconds
      }, 2000);
      const params = getParams();
      const url = `document/check/expired?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`;
    await userRequest.put(url);
      clearTimeout(loadingTimeout);
      setSearchExpired(true); // Set the expired state to true
    } catch (err) {
      handleRequestErrorAlert(err); // Handle errors
      setErrors({ message: err.response?.data?.error });
    } finally {
      setLoading(false); // Set loading state to false
    }
  }, [getParams]);
  */

  //button download removed, preview now have custom name
  const getExpiredReport = useCallback(async (preview) => {
    const params = getParams();
    try {
      let loadingTimeout = setTimeout(() => {
        setLoading(true); // Set loading state to true after 2 seconds
      }, 2000);
      const response = await userRequest.get(
        "document/generate/reportexpired",
        { params},
      );
      clearTimeout(loadingTimeout);

         //previous solution worked with blob, but could not pass custom name
         const folder = response.data.folder;
         const filename = response.data.filename;
         const publicUrl = `${BASE_URL}document/preview/report/${filename}?folder=${folder}`;
         window.open(publicUrl, "_blank");

        if (isAdmin || superAdmin) {
          setTimeout(() => {
            setModalOnDeleteExpired(true); // Set the modal for expired documents
          }, 1000);
        }
    }catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error});
    } finally {
      setLoading(false); // Set loading state to false
    }
  }, [getParams, isAdmin, superAdmin]);

  const deleteExpiredDocuments = useCallback(async () => {
    try {
      let loadingTimeout = setTimeout(() => {
        setLoading(true); // Set loading state to true after 2 seconds
      }, 2000);
      const params = getParams();
      //await userRequest.put("document/check/expired", { params }); // Call the backend route
      const url = `document/delete/expired?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`;
    
    await userRequest.delete(url);
    clearTimeout(loadingTimeout);

    await getDocuments(); // Refresh the documents list after deletion
      setChoiceModalDeleteExpired(false);
    } catch (err) {
      handleRequestErrorAlert(err); // Handle errors
      setErrors({ message: err.response?.data?.error });
    } finally {
      setLoading(false); // Set loading state to false
    }
  }, [getParams, getDocuments]);

  const handleNextPage = () => {
    setPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const updateLimitBasedOnScreenHeight = () => {
    const screenHeight = window.innerHeight - docsListMinusHeight;
    const itemHeight = 46; // Assuming each item's height as 80px, you can adjust this value based on your item design
    const maxItems = Math.floor(screenHeight / itemHeight);
    setLimit(maxItems);
  };

  useEffect(() => {
    // Call the function initially and on window resize
    updateLimitBasedOnScreenHeight();
    window.addEventListener("resize", updateLimitBasedOnScreenHeight);
    return () =>
      window.removeEventListener("resize", updateLimitBasedOnScreenHeight);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
          try {
            const response = await userRequest.get("categories");
            setCategoriesAll(response.data);
          } catch (err) {
            setErrors({ message: err.response?.data?.error });
          }
        };
    document.title = "DOKUMENTI";
    const fetchData = async () => {
      await Promise.all([getDocuments(), fetchCategories()]);
    };

    fetchData();
  }, [getDocuments]);

  const deleteProduct = useCallback(async () => {
    if (selectedDocumentDelete) {
      await userRequest
        .put("document/recycle/" + selectedDocumentDelete._id, {
          filePath: selectedDocumentDelete.filePath,
        })
        .then(() => {
          getDocuments();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
      setChoiceModalDelete(false);
    }
  }, [selectedDocumentDelete, getDocuments]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteProduct();
    }
  }, [choiceModalDelete, deleteProduct]);

  useEffect(() => {
      if (choiceModalDeleteExpired) {
        deleteExpiredDocuments();
      }
  }, [choiceModalDeleteExpired, deleteExpiredDocuments]);

  /*
  async function ExportToJson() {
  
    //const archivebook = true;
    //const params = {
    //  archivebook,
    //  ...(searchName ? { name: searchName } : {}),
    //  ...(startDate && endDate ? { startdate: startDate, enddate: endDate } : {})
    //};
    
    const params = getParams();
  
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
          console.log(error);
        }
      });
  
      // Download JSON file
      fileDownload(jsonString, "documents.json");
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error});
    }
  }
  */

  /*
  //disabled for now
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
  */

  function sortingOriginDate() {
    setSortBy("originDate");
    setSortOrder(!sortOrder);
    //getDocuments();
  }

  function sortingContent() {
    setSortBy("content");
    setSortOrder(!sortOrder);
    //getDocuments();
  }
  function sortingSerialNumber() {
    setSortBy("serialNumber");
    setSortOrder(!sortOrder);
   // getDocuments();
  }

  const filterByContent = (event) => {
    setSearchContent(event.target.value.toLowerCase());
    //getDocuments();
  };

  const sectionsInfo = [
    {
      icon: <AiFillEdit size={20} title="Izmeni" />,
      text: "Izmeni dokument",
      buttonClass: "edit",
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši dokument",
      buttonClass: "delete",
    },
    {
      header: "Pretraga po datumu nastanka:",
      text: "uključujući oba datuma. Brisanje bilo kog datuma, vraća sva dokumenta",
    },
  ];

  return (
    <>
      <div className="px-2 py-1 border-2 border-default rounded-lg bg-white">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl text-default font-bold">DOKUMENTI</h1>
            <Link to="/document/new">
              <button className="button-basic flex items-center ml-1">
                <IoMdAddCircle className="mr-1 text-xl"/>Dodaj</button>
            </Link>
          </div>
          <div className="flex items-center">
            <button
              className="button-basic flex items-center mr-1"
              title="Pregledaj bezvredni materijal"
              onClick={() => getExpiredReport(true)}
            >
              <FaBookOpen className="mr-1 text-xl" title="Pregledaj bezvredni materijal" /> Bezvredni materijal
            </button>
            <button
              className="button-basic flex items-center"
              title="Pregledaj arhivsku knjigu"
              onClick={() => getArchiveBook()}
            >
              <FaBookOpen className="mr-1 text-xl" title="Pregledaj arhivsku knjigu" /> Arhivska knjiga
            </button>
            {/*
            <p
              onClick={() => ExportToJson()}
              className="cursor-pointer disabled"
            >
              <BiExport  title="Izvezi podatke" className="text-default text-2xl" />
            </p>
            <label title="Uvezi podatke">
              <BiImport className="text-default text-2xl cursor-pointer" />
              <input
                className="hidden"
                type="file"
                accept=".json,application/json"
                disabled
                //multiple
                onChange={(e) => ImportJson(e.target.files[0])}
              />
            </label>
*/}
            <p
              onClick={() => {
                setModalOnInfo(true);
              }}
              className="cursor-pointer ml-1"
            >
              <BsInfoCircle
                title="Informacije"
                className="text-default text-2xl"
              />
            </p>
          </div>
        </div>
      </div>
      <div className="w-full px-2 p-1 border rounded-lg bg-white flex items-center">
        <h1 className="text-lg text-default font-semibold">Sadržaj:</h1>
        <div className="flex items-center">
          <input
            id="search-box"
            placeholder="Filter sadržaj"
            className="input-field ml-1"
            onChange={filterByContent}
          />
        </div>
        <h1 className="text-lg text-default font-semibold ml-1">Kategorija:</h1>
        <div className="flex items-center">
        <CategorySelect
          className="ml-1 w-48"
          value={searchCategory}
          onChange={(ev) => setSearchCategory(ev.target.value)}
          options={categoriesAll}
        />
        </div>
        <h1 className="text-lg text-default font-semibold ml-1">
          Nastao:
        </h1>
        <div className="flex ml-1">
          <DatePicker
            className="border-2 border-default w-24 cursor-pointer"
            selected={searchStartDate}
            onChange={(date) => setSearchStartDate(date)}
            dateFormat="dd/MM/yyyy"
          />
          <label className="mx-1 text-md text-default font-bold">-</label>
          <DatePicker
            className="border-2 border-default w-24 cursor-pointer"
            selected={searchEndDate}
            onChange={(date) => setSearchEndDate(date)}
            dateFormat="dd/MM/yyyy"
          />
        </div>
        <h1 className="text-lg text-default font-semibold ml-1">
          Bezvredni:
        </h1>
        <div className="flex items-center cursor-pointer">
          <input
            id="expired-checkbox"
            type="checkbox"
            checked={searchExpired}
            className="ml-1 w-5 h-5 rounded-full border-2 cursor-pointer"
            onChange={(e) => setSearchExpired(e.target.checked)}
          />
        </div>
      </div>
      <div className="grid-document pl-2">
        <div
          className={
            sortBy === "serialNumber"
              ? "column-default-header-active"
              : "column-default-header"
          }
          onClick={() => {
            sortingSerialNumber();
          }}
        >
          Redni br.
          {sortBy === "serialNumber" && !sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
        </div>
        <div
          className={
            sortBy === "content"
              ? "column-default-header-active"
              : "column-default-header"
          }
          onClick={() => {
            sortingContent();
          }}
        >
          Sadržaj
          {sortBy === "content" && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
        </div>
        <div className={"column-default-header"}>Kategorija</div>
        <div
          className={
            sortBy === "originDate"
              ? "column-default-header-active"
              : "column-default-header"
          }
          onClick={() => {
            sortingOriginDate();
          }}
        >
          Nastao
          {sortBy === "originDate" && !sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
          {
            /*
          Kreirano
          {sortBy === "createdAt" && !sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
            */
        }
        </div>
      </div>
      <div 
        className="overflow-y-auto"
        style={{ height: `calc(100vh - ${docsListMinusHeight}px)` }}
      >
        <ul>
          {documents.map((document, id) => (
            <li
              key={id}
              className="row-properties  grid-document"
              onDoubleClick={() => navigate(`/document/edit/${document._id}`)}
            >
              <p className="px-1">{document.serialNumber}.</p>
              <p className="px-1 truncate">{document.content}</p>
              <p className="px-1 truncate">
                {document.categories.map((category, index) => (
                  <span key={index} className="px-1 truncate">
                    {`${category.serialNumber}.${category.name}`}
                    {index < document.categories.length - 1 && ", "}
                  </span>
                ))}
              </p>
              <p className="hidden sm:flex px-1">
                {date.format(new Date(document.originDate), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <Link to={"/document/edit/" + document._id}>
                  <button className={"button-basic"}>
                    <AiFillEdit size={20} title="Izmeni" />
                  </button>
                </Link>
                <button
                  className={"button-basic ml-1"}
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
      <div className="flex items-center fixed bottom-0 w-full">
        <button
          className="button-basic"
          onClick={handlePreviousPage}
          disabled={page === 1}
        >
          <ImArrowLeft size={20} />
        </button>
        <span className="mx-2 text-gray-800">
          Strana {page} od {totalPages}
        </span>
        <button
          className="button-basic"
          onClick={handleNextPage}
          disabled={page === totalPages}
        >
          <ImArrowRight size={20} />
        </button>
        <div>
        <ErrorMessages errors={errors} />
        </div>
      </div>
      {modalOnDelete && (
        <DeleteModal
          setModalOn={setModalOnDelete}
          setChoice={setChoiceModalDelete}
          modalMessage={`Da li želite obrisati sa sadržajem: ${selectedDocumentDelete.content}?`}
        />
      )}
      {modalOnDeleteExpired && (
        <DeleteModal
          setModalOn={setModalOnDeleteExpired}
          setChoice={setChoiceModalDeleteExpired}
          modalMessage={`Ako je izveštaj bezvrednog materijala ispravan, obrišite istekle dokumente?`}
        />
      )}
      {modalOnInfo && (
        <InfoModal
          onClose={() => setModalOnInfo(false)}
          sections={sectionsInfo}
        />
      )}
      <LoadingModal isVisible={loading} />
    </>
  );
};

export default DocumentDynamic;
