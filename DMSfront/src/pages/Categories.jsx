import React, { useEffect, useState, useCallback } from "react";
import {
  BiSolidDownArrowAlt,
  BiSolidUpArrowAlt,
} from "react-icons/bi";
import { BsInfoCircle } from "react-icons/bs";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { userRequest } from "../utils/requestMethods";
import date from "date-and-time";
import ModalDelete from "../components/modal/DeleteModal";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import { useSelector } from "react-redux";
import InfoModal from "../components/modal/InfoModal";
import SearchFilter from "../components/SearchFilter";

const Categories = () => {
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryDelete, setSelectedCategoryDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [keepPeriod, setKeepPeriod] = useState(0);
  const [selectedCategoryEdit, setSelectedCategoryEdit] = useState(null);
  const [modalOnInfo, setModalOnInfo] = useState(false);
  const [consentNumber, setConsentNumber] = useState("");

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const user = useSelector((state) => state.user.currentUser);
  const isAdmin = user && user.isAdmin;

  const [errors, setErrors] = useState({});

  const getCategories = useCallback(async () => {
    try {
        const response = await userRequest.get("categories");
        setCategories(response.data);
        setFilteredCategories(response.data);
    } catch (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error});
    }
  },[]);

  const getConsentNumber = useCallback(async () => {
    await userRequest
      .get("settings/brojSaglasnosti")
      .then((response) => {
        setConsentNumber(response.data.value);
      })
      .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error});
      });
  }, []);

  const updateConsentNumber = async () => {
    try {
      setErrors({});
      await userRequest.put("settings/consentnumber", { value: consentNumber });
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error});
    }
  };

  useEffect(() => {
    getCategories();
    getConsentNumber();
    document.title = "KATEGORIJE";
  }, [getConsentNumber,getCategories]);

  const deleteCategory = useCallback(async () => {
    if (selectedCategoryDelete) {
      await userRequest
          .delete("categories/" + selectedCategoryDelete._id)
          .then(() => {
            getCategories();
          })
          .catch(function (err) {
            handleRequestErrorAlert(err);
            setErrors({ message: err.response?.data?.error});
          });
      setChoiceModalDelete(false);
    }
  }, [selectedCategoryDelete, getCategories]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteCategory();
    }
  }, [choiceModalDelete, deleteCategory]);

  const validateForm = () => {
    const errors = {};
    if (!name) errors.name = "Naziv kategorije je obavezan!";
    if (!label) errors.label = "Oznaka kategorije je obavezna!";
    if (!keepPeriod) errors.keepPeriod = "Rok čuvanja kategorije je obavezan!";
    return errors;
  };

  async function saveDocument(ev) {
    ev.preventDefault();
    setErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    if (selectedCategoryEdit) {
      //editing
      await userRequest.put("categories/" + selectedCategoryEdit._id, {
        name,
        label,
        keepPeriod,
      }).then(() => {
        setName("");
        setLabel("");
        setKeepPeriod(0);
        setSelectedCategoryEdit(null);
        getCategories();
      })
      .catch(function (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error});
      });
    } else {
      await userRequest.post("categories", {
        name,
        label,
        keepPeriod,
      }).then(() => {
        setName("");
        setLabel("");
        setKeepPeriod(0);
        getCategories();
      })
      .catch(function (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error});
      });
    }
  }

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
    setSortBy('createdAt');
    setSortOrder(!sortOrder);
  }

  function sortingName() {
    if (!sortOrder) {
      filteredCategories.sort((a, b) => (a.name > b.name ? 1 : -1));
    } else {
      filteredCategories.sort((a, b) => (b.name > a.name ? 1 : -1));
    }
    setSortBy('name');
    setSortOrder(!sortOrder);
  }

  function sortingLabel() {
    if (!sortOrder) {
      filteredCategories.sort((a, b) => (a.label > b.label ? 1 : -1));
    } else {
      filteredCategories.sort((a, b) => (b.label > a.label ? 1 : -1));
    }
    setSortBy('label');
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
      buttonClass: "edit"
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši kategoriju",
      buttonClass: "delete"
    },
    {
      header : "Rok čuvanja iz liste kategorija",
      text: "unosi se broj meseci. Ako je broj deljiv sa 12 bez ostatka, onda prikaz u arhivskoj knjizi je izrazen u godinama.",
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
          <h1 className="text-xl text-color font-bold">KATEGORIJE</h1>
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
              {isAdmin && <button onClick={() => updateConsentNumber()} className="button-basic ml-1 p-1">Snimi</button>}
            </p>
            <p
              onClick={() => {
                setModalOnInfo(true);
              }}
              className="cursor-pointer ml-1"
            >
              <BsInfoCircle  title="Informacije" className="text-color text-2xl" />
            </p>
          </div>
        </div>
        <form onSubmit={saveDocument}>
        <div className="my-0 flex items-center w-full">
              <input
                className="input-field w-1/4"
                type="text"
                value={name}
                placeholder="Naziv kategorije"
                onChange={(ev) => setName(ev.target.value)}
              />
              <input
                className="input-field w-1/12 ml-1"
                type="text"
                value={label}
                placeholder="Oznaka"
                onChange={(ev) => setLabel(ev.target.value)}
              />
              <div className="flex ml-1">
                <button
                  type="submit"
                  className="button-basic"
                >
                  {selectedCategoryEdit ? `Izmeni` : "Kreiraj"}
                </button>
                <button
                  key={selectedCategoryEdit?._id}
                  className="button-default ml-1"
                  type="button"
                  onClick={() => {
                    setSelectedCategoryEdit(null);
                    setName("");
                    setLabel("");
                    setKeepPeriod(0);
                    setErrors({});
                  }}
                >
                  Otkaži
                </button>
              </div>  
          </div>
          <div className="mt-1 flex items-center"> 
              <label className="text-color">Rok čuvanja iz liste kategorija:</label>
              <input
                className="input-field w-1/12 ml-1"
                type="number"
                value={keepPeriod === 0 ? '' : keepPeriod}
                placeholder="Broj meseci"
                onChange={(ev) => setKeepPeriod(ev.target.value)}
              />  
          </div>
          {Object.keys(errors).length > 0 && (
            <div className="text-rose-600 ml-1">
              {Object.keys(errors).map((key) => (
                <p key={key}>{errors[key]}</p>
              ))}
            </div>
          )}
        </form>
      </div>
      <SearchFilter sections={sectionsFilter} />
      <div className="grid grid-cols-5 items-center justify-between pl-2">
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
            sortBy === 'label'
              ? 'inline-flex font-semibold text-teal-400 cursor-pointer'
              : 'inline-flex font-semibold text-gray-800 cursor-pointer'
          }
          onClick={() => {
            sortingLabel();
          }}>
          Oznaka
          { sortBy === 'label' && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
          </span>
        </div>
        <div className="inline-flex font-semibold text-gray-800 cursor-pointer">
          Rok čuvanja
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
      </div>
      <div className="overflow-y-auto h-[calc(100vh-280px)]">
        <ul>
          {filteredCategories.map((category, id) => (
            <li
              key={id}
              className={`rounded-lg border p-1 pl-2 grid grid-cols-5 items-center justify-between cursor-pointer ${category._id === selectedCategoryEdit?._id ? 'bg-teal-200' : 'bg-white hover:bg-gray-50'}`}
              onDoubleClick={() => {
                setSelectedCategoryEdit(category);
                setName(category.name);
                setLabel(category.label);
                setKeepPeriod(category.keepPeriod ?? 0);
                setErrors({});
              }}
            >              
              <p>{category.name}</p>
              <p className="hidden sm:flex items-center">
                {category.label}
              </p>
              <p className="hidden sm:flex">{category.keepPeriod}</p>
              <p className="hidden sm:flex">
                {date.format(new Date(category.createdAt), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <button
                  className={"button-edit"}
                  onClick={() => {
                    setSelectedCategoryEdit(category);
                    setName(category.name);
                    setLabel(category.label);
                    setKeepPeriod(category.keepPeriod);
                    setErrors({});
                  }}
                  title="Izmeni"
                >
                  <AiFillEdit size={20}/>
                </button>
                <button
                  className={"button-delete ml-1"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedCategoryDelete(category);
                  }}
                  title="Obriši"
                >
                  <AiFillDelete size={20} title="Obriši"/>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
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
