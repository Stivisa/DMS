import React, { useEffect, useState, useCallback } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { BiSolidDownArrowAlt, BiSolidUpArrowAlt } from "react-icons/bi";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { userRequest } from "../utils/requestMethods";
import date from "date-and-time";
import ModalDelete from "../components/modal/DeleteModal";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import InfoModal from "../components/modal/InfoModal";
import SearchFilter from "../components/SearchFilter";
import ErrorMessages from "../components/ErrorMessages";

const Locations = () => {
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocationDelete, setSelectedLocationDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [name, setName] = useState("");
  const [selectedLocationEdit, setSelectedLocationEdit] = useState(null);
  const [modalOnInfo, setModalOnInfo] = useState(false);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const [errors, setErrors] = useState({});

  const getLocations = useCallback(async () => {
    try {
      const response = await userRequest.get("locations");
      setLocations(response.data);
      setFilteredLocations(response.data);
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    }
  }, []);

  useEffect(() => {
    getLocations();
    document.title = "LOKACIJE";
  }, [getLocations]);

  const deleteLocation = useCallback(async () => {
    if (selectedLocationDelete) {
      await userRequest
        .delete("locations/" + selectedLocationDelete._id)
        .then(() => {
          getLocations();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
      setChoiceModalDelete(false);
    }
  }, [selectedLocationDelete, getLocations]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteLocation();
    }
  }, [choiceModalDelete, deleteLocation]);

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Naziv lokacije je obavezan!";
    return errors;
  };

  async function saveLocation(ev) {
    ev.preventDefault();
    setErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    if (selectedLocationEdit) {
      await userRequest
        .put("locations/" + selectedLocationEdit._id, { name })
        .then(() => {
          setName("");
          setSelectedLocationEdit(null);
          getLocations();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
    } else {
      await userRequest
        .post("locations", { name })
        .then(() => {
          setName("");
          getLocations();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
    }
  }

  function sortingCreatedAt() {
    if (!sortOrder) {
      filteredLocations.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
    } else {
      filteredLocations.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    }
    setSortBy("createdAt");
    setSortOrder(!sortOrder);
  }

  function sortingName() {
    if (!sortOrder) {
      filteredLocations.sort((a, b) => (a.name > b.name ? 1 : -1));
    } else {
      filteredLocations.sort((a, b) => (b.name > a.name ? 1 : -1));
    }
    setSortBy("name");
    setSortOrder(!sortOrder);
  }

  const filterByName = (event) => {
    const query = event.target.value;
    if (query.trim().length === 0) {
      setFilteredLocations(locations);
    } else {
      const updatedList = locations.filter((item) =>
        item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1,
      );
      setFilteredLocations(updatedList);
    }
  };

  const sectionsInfo = [
    {
      icon: <AiFillEdit size={20} title="Izmeni" />,
      text: "Izmeni lokaciju",
      buttonClass: "edit",
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši lokaciju",
      buttonClass: "delete",
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
          <h1 className="text-xl text-default font-bold">LOKACIJE</h1>
          <div className="flex items-center">
            <p
              onClick={() => setModalOnInfo(true)}
              className="cursor-pointer"
            >
              <BsInfoCircle title="Informacije" className="text-default text-2xl" />
            </p>
          </div>
        </div>
        <form onSubmit={saveLocation}>
          <div className="my-1 flex items-center w-full">
            <input
              className="input-field w-1/4"
              type="text"
              value={name}
              placeholder="Naziv nove lokacije"
              onChange={(ev) => setName(ev.target.value)}
            />
            <div className="flex ml-1">
              <button type="submit" className="button-basic">
                {selectedLocationEdit ? "Izmeni" : "Kreiraj"}
              </button>
              <button
                className="button-default ml-1"
                type="button"
                onClick={() => {
                  setSelectedLocationEdit(null);
                  setName("");
                  setErrors({});
                }}
              >
                Otkaži
              </button>
            </div>
          </div>
          <ErrorMessages errors={errors} />
        </form>
      </div>
      <div className="search-filter-div">
        <SearchFilter sections={sectionsFilter} />
      </div>
      <div className="grid grid-cols-3 items-center justify-between pl-2">
        <div>
          <span
            className={
              sortBy === "name"
                ? "column-default-header-active"
                : "column-default-header"
            }
            onClick={sortingName}
          >
            Naziv
            {sortBy === "name" && sortOrder ? (
              <BiSolidDownArrowAlt className="arrow" />
            ) : (
              <BiSolidUpArrowAlt className="arrow" />
            )}
          </span>
        </div>
        <div>
          <span
            className={
              sortBy === "createdAt"
                ? "column-default-header-active"
                : "column-default-header"
            }
            onClick={sortingCreatedAt}
          >
            Kreirano
            {sortBy === "createdAt" && sortOrder ? (
              <BiSolidDownArrowAlt className="arrow" />
            ) : (
              <BiSolidUpArrowAlt className="arrow" />
            )}
          </span>
        </div>
        <div className="column-default-header">Akcije</div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-190px)]">
        <ul>
          {filteredLocations.map((location) => (
            <li
              key={location._id}
              className="grid grid-cols-3 row-properties items-center"
            >
              <p className="px-1">{location.name}</p>
              <p className="px-1">
                {date.format(new Date(location.createdAt), "DD-MM-YYYY")}
              </p>
              <div className="flex">
                <button
                  className="button-edit"
                  onClick={() => {
                    setSelectedLocationEdit(location);
                    setName(location.name);
                  }}
                >
                  <AiFillEdit size={20} title="Izmeni" />
                </button>
                <button
                  className="button-delete ml-1"
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedLocationDelete(location);
                  }}
                >
                  <AiFillDelete size={20} title="Obriši" />
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
          modalMessage={`Da li želite obrisati lokaciju: ${selectedLocationDelete.name}?`}
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

export default Locations;
