import React, { useEffect, useState } from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { IoDocument } from "react-icons/io5";
import { FaRecycle } from "react-icons/fa";
import { BiSolidDownArrowAlt, BiSolidUpArrowAlt } from "react-icons/bi";
import { userRequest } from "../../utils/requestMethods";
import DeleteModal from "../../components/modal/DeleteModal";
import { useNavigate, Link } from "react-router-dom";
import date from "date-and-time";
import { handleRequestErrorAlert } from "../../utils/errorHandlers";

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
  const [sortCreatedAt, setSortCreatedAt] = useState(false);
  const [sortDeletedAt, setSortDeletedAt] = useState(false);
  const [sortName, setSortName] = useState(false);
  const navigate = useNavigate();

  const getDocuments = async () => {
    await userRequest
      .get("documents/recycle/all")
      .then((response) => {
        setDocuments(response.data);
        setFilteredDocuments(response.data);
      })
      .catch(function (error) {
        handleRequestErrorAlert(error);
      });
  };

  useEffect(() => {
    document.title = "OBRISANI DOKUMENTI";
    getDocuments();
  }, []);

  useEffect(() => {
    async function deleteProduct() {
      await userRequest
        .delete("documents/" + selectedDocumentDelete._id)
        .catch(function (error) {
          handleRequestErrorAlert(error);
        });
    }
    async function restoreProduct() {
      await userRequest
        .put("documents/restore/" + selectedDocumentDelete._id, {
          filePath: selectedDocumentDelete.filePath,
        })
        .catch(function (error) {
          handleRequestErrorAlert(error);
        });
    }
    if (choiceModalDelete === true) {
      deleteProduct();
      setChoiceModalDelete(false);
    }
    if (choiceModalRestore === true) {
      restoreProduct();
      setChoiceModalRestore(false);
    }
    getDocuments();
  }, [selectedDocumentDelete, choiceModalDelete, choiceModalRestore]);

  function sortingCreatedAt() {
    if (sortCreatedAt) {
      documents.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    setSortCreatedAt(!sortCreatedAt);
  }

  function sortingDeletedAt() {
    if (sortDeletedAt) {
      documents.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    setSortDeletedAt(!sortDeletedAt);
  }

  function sortingName() {
    if (sortName) {
      documents.sort((a, b) =>
        a.translations?.sr?.name > b.translations?.sr?.name ? 1 : -1,
      );
    } else {
      documents.sort((a, b) =>
        b.translations?.sr?.name > a.translations?.sr?.name ? 1 : -1,
      );
    }
    setSortName(!sortName);
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

  return (
    <div className="bg-gray-200 px-2">
      <div className="w-full  p-1 border rounded-lg bg-white">
        <div className=" w-full flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl px-2 font-bold">OBRISANI DOKUMENTI</h1>
          </div>
          <div className="flex items-center">
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

      <div className="w-full p-3 border rounded-lg bg-white">
        <h1 className="mb-1 text-lg font-bold">Filteri pretrage</h1>
        <input
          id="search-box"
          placeholder="Filter naziv"
          className=" shadow border rounded px-2 py-1 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
          onChange={filterByName}
        />
      </div>
      <div className="px-2 grid md:grid-cols-4 sm:grid-cols-4 grid-cols-2 items-center justify-between cursor-pointer">
        <div
          onClick={() => {
            sortingName();
          }}
          className="flex px-12"
        >
          <span className="font-bold">Naziv</span>
          {sortName ? (
            <BiSolidDownArrowAlt className="text-purple-800 text-2xl" />
          ) : (
            <BiSolidUpArrowAlt className="text-purple-800 text-2xl" />
          )}
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
        <div
          className="flex"
          onClick={() => {
            sortingDeletedAt();
          }}
        >
          <span className="hidden sm:grid font-bold">Obrisano</span>
          {sortDeletedAt ? (
            <BiSolidDownArrowAlt className="text-purple-800 text-2xl" />
          ) : (
            <BiSolidUpArrowAlt className="text-purple-800 text-2xl" />
          )}
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-240px)]">
        <ul>
          {filteredDocuments.map((product, id) => (
            <li
              key={id}
              className="bg-white hover:bg-gray-50 rounded-lg border p-1 grid md:grid-cols-4 sm:grid-cols-4 grid-cols-2 items-center justify-between cursor-pointer"
              onDoubleClick={() => navigate(`/documents/edit/${product._id}`)}
            >
              <div className="flex items-center">
                <div className="bg-purple-300 p-3 rounded-lg">
                  <IoDocument className="text-purple-800" />
                </div>
                <p className="pl-4">{product.name}</p>
              </div>
              <div className="hidden sm:flex">
                {date.format(new Date(product.createdAt), "HH:mm DD-MM-YYYY ")}
              </div>
              <div className="hidden sm:flex">
                {date.format(new Date(product.deletedAt), "HH:mm DD-MM-YYYY ")}
              </div>
              <div className="flex ml-auto">
                <p
                  className={"bg-green-300 p-3 ml-1 rounded-lg"}
                  onClick={() => {
                    setModalOnRecycle(true);
                    setSelectedDocumentDelete(product);
                  }}
                >
                  <FaRecycle title="Vrati" className="text-green-800" />
                </p>
                <Link to={"/documents/edit/" + product._id}>
                  <p className={"bg-blue-300 p-3 ml-1 rounded-lg"}>
                    <AiFillEdit title="Izmeni" />
                  </p>
                </Link>
                <p
                  className={"bg-red-300 p-3 ml-1 rounded-lg"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedDocumentDelete(product);
                  }}
                >
                  <AiFillDelete title="Obriši" className="text-red-800" />
                </p>
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
            className="w-full max-w-md rounded-lg shadow-lg bg-white border-2 flex fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 "
          >
            <div className="w-full">
              <div className="flex flex-col justify-center text-center mt-0 px-4 py-4">
                <h1 className="text-2xl">POMOĆ</h1>
                <div className="flex justify-center items-center">
                  <p className={"bg-green-300 p-3 rounded-lg"}>
                    <FaRecycle title="Vrati" />
                  </p>
                  Vrati dokument
                </div>
                <div className="flex justify-center items-center mt-1">
                  <p className={"bg-blue-300 p-3 rounded-lg"}>
                    <AiFillEdit title="Izmeni" />
                  </p>
                  Izmeni dokument
                </div>
                <div className="flex justify-center items-center mt-1">
                  <p className={"bg-red-300 p-3 rounded-lg"}>
                    <AiFillDelete title="Obriši" className="text-red-800" />
                  </p>
                  Obriši dokument
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecycleBin;
