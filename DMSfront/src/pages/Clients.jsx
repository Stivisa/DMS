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

const Clients = () => {
  const [filteredClients, setFilteredClients] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientDelete, setSelectedClientDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [name, setName] = useState("");
  //const [internal, setInternal] = useState(false);
  const [selectedClientEdit, setSelectedClientEdit] = useState(null);
  const [modalOnInfo, setModalOnInfo] = useState(false);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const [errors, setErrors] = useState({});

  const getClients = useCallback(async () => {
    try {
      const response = await userRequest.get("clients");
      setClients(response.data);
      setFilteredClients(response.data);
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    }
  }, []);

  useEffect(() => {
    getClients();
    document.title = "KOMITENTI";
  }, [getClients]);

  const deleteClient = useCallback(async () => {
    if (selectedClientDelete) {
      await userRequest
        .delete("clients/" + selectedClientDelete._id)
        .then(() => {
          getClients();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
      setChoiceModalDelete(false);
    }
  }, [selectedClientDelete, getClients]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteClient();
    }
  }, [choiceModalDelete, deleteClient]);

  const validateForm = () => {
    const errors = {};
    if (!name) errors.username = "Naziv komitenta je obavezan!";
    return errors;
  };

  async function saveClient(ev) {
    ev.preventDefault();
    setErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    if (selectedClientEdit) {
      //editing
      await userRequest
        .put("clients/" + selectedClientEdit._id, {
          name,
          //internal,
        })
        .then(() => {
          setName("");
          //setInternal(false);
          setSelectedClientEdit(null);
          getClients();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
    } else {
      await userRequest
        .post("clients", {
          name,
          //internal,
        })
        .then(() => {
          setName("");
          //setInternal(false);
          getClients();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
    }
  }

  function sortingCreatedAt() {
    if (!sortOrder) {
      filteredClients.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
    } else {
      filteredClients.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    }
    setSortBy("createdAt");
    setSortOrder(!sortOrder);
  }

  function sortingName() {
    if (!sortOrder) {
      filteredClients.sort((a, b) => (a.name > b.name ? 1 : -1));
    } else {
      filteredClients.sort((a, b) => (b.name > a.name ? 1 : -1));
    }
    setSortBy("name");
    setSortOrder(!sortOrder);
  }

  const filterByName = (event) => {
    const query = event.target.value;
    if (query.trim().length === 0) {
      setFilteredClients(clients);
    } else {
      var updatedList = [...clients];
      updatedList = updatedList.filter((item) => {
        return item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
      });
      setFilteredClients(updatedList);
    }
  };

  /*
  const handleInternalChange = () => {
    setInternal(!internal);
  };
  */

  const sectionsInfo = [
    {
      icon: <AiFillEdit size={20} title="Izmeni" />,
      text: "Izmeni komitenta",
      buttonClass: "edit",
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši komitenta",
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
          <h1 className="text-xl text-default font-bold">KOMITENTI</h1>
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
        <form onSubmit={saveClient}>
          <div className="my-1 flex  items-center w-full">
            <input
              className="input-field w-1/4"
              type="text"
              value={name}
              placeholder="Naziv novog komitenta"
              onChange={(ev) => setName(ev.target.value)}
            />
            <div className="flex ml-1">
              <button type="submit" className="button-basic">
                {selectedClientEdit ? `Izmeni` : "Kreiraj"}
              </button>
              <button
                className="button-default ml-1"
                type="button"
                onClick={() => {
                  setSelectedClientEdit(null);
                  setName("");
                  //setInternal(false);
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
          </span>
        </div>
        <div>
          <span
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
          </span>
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-240px)]">
        <ul>
          {filteredClients.map((client, id) => (
            <li
              key={id}
              className={`row-properties grid grid-cols-3 items-center justify-between`}
              onDoubleClick={() => {
                setSelectedClientEdit(client);
                setName(client.name);
                //setInternal(client.internal);
                setErrors({});
              }}
            >
              <p className="truncate">{client.name}</p>
              <p className="hidden sm:flex">
                {date.format(new Date(client.createdAt), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <button
                  className={"button-edit"}
                  onClick={() => {
                    setSelectedClientEdit(client);
                    setName(client.name);
                    //setInternal(client.internal);
                    setErrors({});
                  }}
                >
                  <AiFillEdit size={20} title="Izmeni" />
                </button>
                <button
                  className={"button-delete ml-1"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedClientDelete(client);
                  }}
                >
                  <AiFillDelete title="Obriši" size={20} />
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
          modalMessage={`Da li želite obrisati komitenta: ${selectedClientDelete.name}?`}
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
export default Clients;
