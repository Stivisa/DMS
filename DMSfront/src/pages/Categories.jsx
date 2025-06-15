import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BiSolidDownArrowAlt, BiSolidUpArrowAlt } from "react-icons/bi";
import { BsInfoCircle } from "react-icons/bs";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { IoMdAddCircle } from "react-icons/io";
import { userRequest } from "../utils/requestMethods";
import date from "date-and-time";
import ModalDelete from "../components/modal/DeleteModal";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import { useSelector } from "react-redux";
import InfoModal from "../components/modal/InfoModal";
import SearchFilter from "../components/SearchFilter";
import ErrorMessages from "../components/ErrorMessages";
import CategoryFormModal from "./CategoryFormModal";

const Categories = () => {
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryDelete, setSelectedCategoryDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [modalOnInfo, setModalOnInfo] = useState(false);
  const [consentNumber, setConsentNumber] = useState("");

  const [searchParams] = useSearchParams(); // Get query parameters, when you click link in documentForm

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const user = useSelector((state) => state.user.currentUser);
  const isAdmin = user && user.isAdmin;

  const [errors, setErrors] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);

  const getCategories = useCallback(async () => {
    try {
      const response = await userRequest.get("categories");
      setCategories(response.data);
      setFilteredCategories(response.data);

      // Check if categoryId exists in query parameters
      const categoryId = searchParams.get("categoryId");
      if (categoryId) {
        const category = response.data.find((cat) => cat._id === categoryId);
        if (category) {
          setCurrentCategory(category);
          setIsModalOpen(true); // Open the modal
        }
      }

    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    }
  }, [searchParams]);

  const getConsentNumber = useCallback(async () => {
    await userRequest
      .get("settings/brojSaglasnosti")
      .then((response) => {
        setConsentNumber(response.data.value);
      })
      .catch(function (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error });
      });
  }, []);

  const updateConsentNumber = async () => {
    try {
      setErrors({});
      await userRequest.put("settings/consentnumber", { value: consentNumber });
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    }
  };

  useEffect(() => {
    getCategories();
    getConsentNumber();
    document.title = "KATEGORIJE";
  }, [getConsentNumber, getCategories]);

  const deleteCategory = useCallback(async () => {
    if (selectedCategoryDelete) {
      await userRequest
        .delete("categories/" + selectedCategoryDelete._id)
        .then(() => {
          getCategories();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
      setChoiceModalDelete(false);
    }
  }, [selectedCategoryDelete, getCategories]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteCategory();
    }
  }, [choiceModalDelete, deleteCategory]);

  const handleOpenModal = (category = null) => {
    setCurrentCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
  };

  function sortingCreatedAt() {
    if (!sortOrder) {
      filteredCategories.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
    } else {
      filteredCategories.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    }
    setSortBy("createdAt");
    setSortOrder(!sortOrder);
  }

  function sortingName() {
    if (!sortOrder) {
      filteredCategories.sort((a, b) => (a.name > b.name ? 1 : -1));
    } else {
      filteredCategories.sort((a, b) => (b.name > a.name ? 1 : -1));
    }
    setSortBy("name");
    setSortOrder(!sortOrder);
  }

  function sortingLabel() {
    if (!sortOrder) {
      filteredCategories.sort((a, b) => (a.label > b.label ? 1 : -1));
    } else {
      filteredCategories.sort((a, b) => (b.label > a.label ? 1 : -1));
    }
    setSortBy("label");
    setSortOrder(!sortOrder);
  }

  function sortingSerialNumber() {
    if (!sortOrder) {
      filteredCategories.sort((a, b) => a.serialNumber - b.serialNumber);
    } else {
      filteredCategories.sort((a, b) => b.serialNumber - a.serialNumber);
    }
    setSortBy("serialNumber");
    setSortOrder(!sortOrder);
  }

  const filterByName = (event) => {
    const query = event.target.value;
    if (query.trim().length === 0) {
      setFilteredCategories(categories);
    } else {
      var updatedList = [...categories];
      updatedList = updatedList.filter((item) => {
        return item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
      });
      setFilteredCategories(updatedList);
    }
  };

  const sectionsInfo = [
    {
      icon: <AiFillEdit size={20} title="Izmeni" />,
      text: "Izmeni kategoriju",
      buttonClass: "edit",
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši kategoriju",
      buttonClass: "delete",
    },
    {
      header: "Rok čuvanja iz liste kategorija",
      text: "unosi se broj godina i/ili meseci (inače podrazumevano trajno)",
    },
    {
      header: "Oznaka",
      text: "opciono polje, zavisi od usvojene klasifikacije. Treba odlučiti da li je obavezno i onda popunjavati za sve, u tom slučaju arhivska knjiga sadrzi oznaku, inače se navodi redni broj.",
    },
  ];

  const sectionsFilter = [
    {
      onChange: filterByName,
      title: "Naziv",
      placeholder: "Filter naziv",
      type: "text",
    },
  ];

  return (
    <>
      <div className="px-2 py-1 border-2 border-default rounded-lg bg-white">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
          <h1 className="text-xl text-default font-bold">KATEGORIJE</h1>
          <button className="button-basic flex items-center ml-1" onClick={() => handleOpenModal()}>
            <IoMdAddCircle className="mr-1 text-xl"/>Dodaj
          </button>
        </div>
          <div className="flex items-center">
            <p className="italic">
              Broj saglasnosti na listu kategorija:
              <input
                className="input-field ml-1 p-1 font-medium"
                type="text"
                value={consentNumber}
                placeholder="Broj saglasnosti"
                disabled={!isAdmin}
                onChange={(ev) => setConsentNumber(ev.target.value)}
              />
              {isAdmin && (
                <button
                  onClick={() => updateConsentNumber()}
                  className="button-basic ml-1 p-1"
                >
                  Snimi
                </button>
              )}
            </p>
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
        <ErrorMessages errors={errors} />
      </div>
      <div className="search-filter-div">
        <SearchFilter sections={sectionsFilter} />
      </div>
      <div className="grid-category pl-2">
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
            sortBy === "name"
              ? "column-default-header-active"
              : "column-default-header"
          }
          onClick={() => {
            sortingName();
          }}
        >
          Naziv
          {sortBy === "name" && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
        </div>
        <div
          className={
            sortBy === "label"
              ? "column-default-header-active"
              : "column-default-header"
          }
          onClick={() => {
            sortingLabel();
          }}
        >
          Oznaka
          {sortBy === "label" && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
        </div>
        <div className="column-default-header">Rok čuvanja</div>
        <div
          className={
            sortBy === "createdAt"
              ? "column-default-header-active"
              : "column-default-header"
          }
          onClick={() => {
            sortingCreatedAt();
          }}
        >
          Kreirano
          {sortBy === "createdAt" && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-280px)]">
        <ul>
          {filteredCategories.map((category, id) => (
            <li
              key={id}
              className={"row-properties grid-category"}
              onDoubleClick={() => {
                setErrors({});
                handleOpenModal(category)
              }}
            >
              <p className="px-1">{category.serialNumber}.</p>
              <p className="px-1 truncate">{category.name}</p>
              <p className="hidden sm:flex px-1 truncate">{category.label}</p>
              <p className="hidden sm:flex px-1">
                {category.keepPeriod === 0
                  ? "trajno"
                  : `${category.keepYears ? category.keepYears + " god." : ""}${
                      category.keepMonths
                        ? " " + category.keepMonths + " mes."
                        : ""
                    }`}
              </p>
              <p className="hidden sm:flex px-1">
                {date.format(new Date(category.createdAt), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <button
                  className={"button-edit"}
                  onClick={() => {
                    setErrors({});
                    handleOpenModal(category)
                  }}
                  title="Izmeni"
                >
                  <AiFillEdit size={20} />
                </button>
                <button
                  className={"button-delete ml-1"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedCategoryDelete(category);
                  }}
                  title="Obriši"
                >
                  <AiFillDelete size={20} title="Obriši" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        getCategories={getCategories}
        category={currentCategory}
      />
      {modalOnDelete && (
        <ModalDelete
          setModalOn={setModalOnDelete}
          setChoice={setChoiceModalDelete}
          modalMessage={`Da li želite obrisati kategoriju: ${selectedCategoryDelete.name}?`}
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
export default Categories;
