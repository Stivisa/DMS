import React, { useEffect, useState, useCallback } from "react";
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
import ErrorMessages from "../../components/ErrorMessages";
import CategorySelect from "../../components/CategorySelect";

const RecycleBin = () => {
  //showing filteredDocuments, while documents always contains all documents
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categoriesAll, setCategoriesAll] = useState([]);
  const [searchCategory, setSearchCategory] = useState("");
  const [selectedDocumentDelete, setSelectedDocumentDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [modalOnRecycle, setModalOnRecycle] = useState(false);
  const [modalOnInfo, setModalOnInfo] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [choiceModalRestore, setChoiceModalRestore] = useState(false);
  const [searchExpired, setSearchExpired] = useState(false);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const getDocuments = useCallback(async () => {
    try {
      const response = await userRequest.get("document/recycle/all");
      setDocuments(response.data);
      setFilteredDocuments(response.data);
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    }
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
    document.title = "OBRISANI DOKUMENTI";
    const fetchData = async () => {
      await Promise.all([getDocuments(), fetchCategories()]);
    };

    fetchData();
  }, [getDocuments]);

  const deleteProduct = useCallback(async () => {
    if (selectedDocumentDelete) {
      await userRequest
        .delete("document/" + selectedDocumentDelete._id)
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

  const restoreProduct = useCallback(async () => {
    if (selectedDocumentDelete) {
      await userRequest
        .put("document/restore/" + selectedDocumentDelete._id, {
          filePath: selectedDocumentDelete.filePath,
        })
        .then(() => {
          getDocuments();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
      setChoiceModalRestore(false);
    }
  }, [selectedDocumentDelete, getDocuments]);

  useEffect(() => {
    if (choiceModalRestore) {
      restoreProduct();
    }
  }, [choiceModalRestore, restoreProduct]);

  function sortingOriginDate() {
    if (!sortOrder) {
      documents.sort((a, b) => new Date(a.originDate) - new Date(b.originDate));
    } else {
      documents.sort((a, b) => new Date(b.originDate) - new Date(a.originDate));
    }
    setSortBy("originDate");
    setSortOrder(!sortOrder);
  }

  function sortingDeletedAt() {
    if (!sortOrder) {
      documents.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    setSortBy("deletedAt");
    setSortOrder(!sortOrder);
  }

  function sortingContent() {
    if (!sortOrder) {
      documents.sort((a, b) =>
        a.sr?.content > b.content ? 1 : -1,
      );
    } else {
      documents.sort((a, b) =>
        b.sr?.content > a.content ? 1 : -1,
      );
    }
    setSortBy("content");
    setSortOrder(!sortOrder);
  }

  function sortingSerialNumber() {
    documents.sort((a, b) => {
      const serialA = a.serialNumber || 0;
      const serialB = b.serialNumber || 0;
      return sortOrder ? serialB - serialA : serialA - serialB;
    });
    setSortBy("serialNumber");
    setSortOrder(!sortOrder);
  }

  const filterByContent = (event) => {
    const query = event.target.value;
    if (query.trim().length === 0) {
      setFilteredDocuments(documents);
    } else {
      var updatedList = [...documents];
      updatedList = updatedList.filter((item) => {
        return item.content.toLowerCase().indexOf(query.toLowerCase()) !== -1;
      });
      setFilteredDocuments(updatedList);
    }
  };

  const filterByCategory = (event) => {
    const selectedCategoryId = event.target.value; // The selected category ID
    if (!selectedCategoryId || selectedCategoryId.trim().length === 0) {
      setFilteredDocuments(documents); // Reset to all documents if no category is selected
    } else {
      const updatedList = documents.filter((item) => {
        // Check if any category in the item's category array matches the selected category ID
        return item.category.some((cat) => cat._id === selectedCategoryId);
      });
      setFilteredDocuments(updatedList);
    }
  };

  const filterByExpired = (isChecked) => {
    if (!isChecked) {
      setFilteredDocuments(documents); // Reset to all documents if the checkbox is unchecked
    } else {
      const updatedList = documents.filter((item) => item.expired === true);
      setFilteredDocuments(updatedList);
    }
  };

  const sectionsInfo = [
    {
      icon: <FaRecycle size={20} title="Vrati" />,
      text: "Vrati dokument iz obrisanih u aktivne",
      buttonClass: "basic",
    },
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
  ];

  const sectionsFilter = [
    {
      onChange: filterByContent,
      title: "Sadržaj",
      placeholder: "Filter sadržaj",
      type: "text",
    },
  ];

  return (
    <>
      <div className="px-2 py-1 border-2 border-default rounded-lg bg-white">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-xl text-default font-bold">OBRISANI DOKUMENTI</h1>
          <div className="flex items-center">
            <p
              onClick={() => {
                setModalOnInfo(true);
              }}
              className="cursor-pointer"
            >
              <BsInfoCircle
                title="Informacije"
                className="text-default text-2xl"
              />
            </p>
          </div>
        </div>
        <ErrorMessages errors={errors} />
      </div>
      <div className="search-filter-div">
      <SearchFilter sections={sectionsFilter} />
      <h1 className="text-lg text-default font-semibold ml-1">Kategorija:</h1>
        <div className="flex items-center">
        <CategorySelect
          className="ml-1 w-48"
          value={searchCategory}
          onChange={(ev) => {
            setSearchCategory(ev.target.value); // Update the selected category
            filterByCategory(ev); // Filter documents based on the selected category
          }}
          options={categoriesAll}
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
            onChange={(e) => {
              const isChecked = e.target.checked;
              setSearchExpired(isChecked); // Update the checkbox state
              filterByExpired(isChecked); // Filter documents based on the expired status
            }}
          />
        </div>       
      </div>
      <div className="grid-recyclebin pl-2">
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
        <div>
          <span
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
            {sortBy === "originDate" && sortOrder ? (
              <BiSolidDownArrowAlt className="arrow" />
            ) : (
              <BiSolidUpArrowAlt className="arrow" />
            )}
          </span>
        </div>
        <div>
          <span
            className={
              sortBy === "deletedAt"
                ? "column-default-header-active"
                : "column-default-header"
            }
            onClick={() => {
              sortingDeletedAt();
            }}
          >
            Obrisano
            {sortBy === "deletedAt" && sortOrder ? (
              <BiSolidDownArrowAlt className="arrow" />
            ) : (
              <BiSolidUpArrowAlt className="arrow" />
            )}
          </span>
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-190px)]">
        <ul>
          {filteredDocuments.map((document, id) => (
            <li
              key={id}
              className="grid-recyclebin row-properties"
              onDoubleClick={() => navigate(`/document/edit/${document._id}`)}
            >
              <p>{document.serialNumber}.</p>
              <p className="truncate">{document.content}</p>
              <p className="px-1 truncate">{`${document.category[0]?.serialNumber}.${document.category[0]?.name}`}</p>
              <p className="hidden sm:flex">
                {date.format(new Date(document.createdAt), "DD-MM-YYYY ")}
              </p>
              <p className="hidden sm:flex">
                {date.format(new Date(document.deletedAt), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <button
                  className={"button-basic ml-1"}
                  onClick={() => {
                    setModalOnRecycle(true);
                    setSelectedDocumentDelete(document);
                  }}
                >
                  <FaRecycle size={20} title="Vrati" />
                </button>
                <Link to={"/document/edit/" + document._id}>
                  <button className={"button-edit ml-1"}>
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
      {modalOnRecycle && (
        <DeleteModal
          setModalOn={setModalOnRecycle}
          setChoice={setChoiceModalRestore}
          modalMessage={`Da li želite vratiti dokument: ${selectedDocumentDelete.name}?`}
          color="green"
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
