import React, { useEffect, useState, useCallback} from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { FaRecycle } from "react-icons/fa";
import { BiSolidDownArrowAlt, BiSolidUpArrowAlt } from "react-icons/bi";
import { userRequest } from "../../utils/requestMethods";
import DeleteModal from "../../components/modal/DeleteModal";
import { useNavigate, Link } from "react-router-dom";
import date from "date-and-time";
import { handleRequestErrorAlert } from "../../utils/errorHandlers";
import InfoModal from "../../components/modal/InfoModal";
import SearchFilter from "../../components/SearchFilter";

const RecycleBin = () => {
  //showing filteredDocuments, while documents always contains all documents
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentDelete, setSelectedDocumentDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [modalOnRecycle, setModalOnRecycle] = useState(false);
  const [modalOnInfo, setModalOnInfo] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [choiceModalRestore, setChoiceModalRestore] = useState(false);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const navigate = useNavigate();

  
  const getDocuments = useCallback(async () => {
    try {
        const response = await userRequest.get("document/recycle/all");
        setDocuments(response.data);
        setFilteredDocuments(response.data);
    } catch (error) {
        handleRequestErrorAlert(error);
    }
  },[]);

  useEffect(() => {
    getDocuments();
    document.title = "OBRISANI DOKUMENTI";
  }, [getDocuments]);

  const deleteProduct = useCallback(async () => {
    if (selectedDocumentDelete) {
      await userRequest
        .delete("document/" + selectedDocumentDelete._id)
        .then(() => {
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

  const restoreProduct = useCallback(async () => {
    if (selectedDocumentDelete) {
      await userRequest
        .put("document/restore/" + selectedDocumentDelete._id, {
          filePath: selectedDocumentDelete.filePath,
        })
        .then(() => {
            getDocuments();
          })
          .catch(function (error) {
            handleRequestErrorAlert(error);
          });
        setChoiceModalRestore(false);
    }
  }, [selectedDocumentDelete, getDocuments]);

  useEffect(() => {
    if (choiceModalRestore) {
      restoreProduct();
    }
  }, [choiceModalRestore, restoreProduct]);

  function sortingCreatedAt() {
    if (!sortOrder) {
      documents.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    setSortBy('createdAt');
    setSortOrder(!sortOrder);
  }

  function sortingDeletedAt() {
    if (!sortOrder) {
      documents.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    setSortBy('deletedAt');
    setSortOrder(!sortOrder);
  }

  function sortingName() {
    if (!sortOrder) {
      documents.sort((a, b) =>
        a.translations?.sr?.name > b.translations?.sr?.name ? 1 : -1,
      );
    } else {
      documents.sort((a, b) =>
        b.translations?.sr?.name > a.translations?.sr?.name ? 1 : -1,
      );
    }
    setSortBy('name');
    setSortOrder(!sortOrder);
  }

  const filterByName = (event) => {
    const query = event.target.value;
    if (query.trim().length === 0) {
      setFilteredDocuments(documents);
    } else {
      var updatedList = [...documents];
      updatedList = updatedList.filter((item) => {
        return item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
      });
      setFilteredDocuments(updatedList);
    }
  };

  const sectionsInfo = [
    {
      icon: <FaRecycle size={20} title="Vrati" />,
      text: "Vrati dokument iz obrisanih u aktivne",
      buttonClass: "basic"
    },
    {
      icon: <AiFillEdit size={20} title="Izmeni" />,
      text: "Izmeni dokument",
      buttonClass: "edit"
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši dokument",
      buttonClass: "delete"
    }
  ];

  const sectionsFilter = [
    {
      onChange: filterByName,
      placeholder: "Filter naziv",
      type: "text"
    }
  ];

  return (
    <>
      <div className="px-2 py-1 border-2 border-gray-400 rounded-lg bg-white">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-xl text-color font-bold">OBRISANI DOKUMENTI</h1>
          <div className="flex items-center">
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
      <SearchFilter sections={sectionsFilter} />
      <div className="grid grid-cols-4 items-center justify-between pl-2">
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
          {sortBy === 'createdAt' && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
          </span>
        </div>
        <div>
          <span className={
            sortBy === 'deletedAt'
              ? 'inline-flex font-semibold text-teal-400 cursor-pointer'
              : 'inline-flex font-semibold text-gray-800 cursor-pointer'
          }
          onClick={() => {
            sortingDeletedAt();
          }}
          >Obrisano
          {sortBy === 'deletedAt' && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
          </span>
        </div> 
      </div>    
      <div className="overflow-y-auto h-[calc(100vh-190px)]">
        <ul>
          {filteredDocuments.map((product, id) => (
            <li
              key={id}
              className="bg-white hover:bg-gray-50 rounded-lg border p-1 pl-2 grid grid-cols-4 items-center justify-between cursor-pointer"
              onDoubleClick={() => navigate(`/document/edit/${product._id}`)}
            >     
              <p>{product.name}</p>
              <p className="hidden sm:flex">
                {date.format(new Date(product.createdAt), "DD-MM-YYYY ")}
              </p>
              <p className="hidden sm:flex">
                {date.format(new Date(product.deletedAt), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <button
                  className={"button-basic ml-1"}
                  onClick={() => {
                    setModalOnRecycle(true);
                    setSelectedDocumentDelete(product);
                  }}
                >
                  <FaRecycle size={20} title="Vrati" />
                </button>
                <Link to={"/document/edit/" + product._id}>
                  <button className={"button-edit ml-1"}>
                    <AiFillEdit size={20} title="Izmeni" />
                  </button>
                </Link>
                <button
                  className={"button-delete ml-1"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedDocumentDelete(product);
                  }}
                >
                  <AiFillDelete size={20} title="Obriši" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {modalOnRecycle && (
        <DeleteModal
          setModalOn={setModalOnRecycle}
          setChoice={setChoiceModalRestore}
          modalMessage={`Da li želite vratiti dokument: ${selectedDocumentDelete.name}?`}
          color = "green"
        />
      )}
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

export default RecycleBin;
