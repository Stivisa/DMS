import React, { useEffect, useState, useCallback } from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { BiSolidDownArrowAlt, BiSolidUpArrowAlt } from "react-icons/bi";
import { BsInfoCircle } from "react-icons/bs";
import { userRequest } from "../utils/requestMethods";
import { useParams } from "react-router-dom";
import date from "date-and-time";
import ModalDelete from "../components/modal/DeleteModal";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import InfoModal from "../components/modal/InfoModal";
import SearchFilter from "../components/SearchFilter";

const Tags = () => {
  const [filteredTags, setFilteredTags] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTagDelete, setSelectedTagDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [name, setName] = useState("");
  const [selectedTagEdit, setSelectedTagEdit] = useState(null);
  const [modalOnInfo, setModalOnInfo] = useState(false);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const [errors, setErrors] = useState({});

  const params = useParams();
  const { id } = params;

  const getTags = useCallback(async () => {
    try {
        const response = await userRequest.get("tags");
        setTags(response.data);
        setFilteredTags(response.data);
    } catch (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error});
    }
  },[]);

  useEffect(() => {
      getTags();
      document.title = "TAGOVI";
  }, [getTags]);

  //link from product passing url id
  useEffect(() => {
    const tagQuery = tags.find((x) => x._id === id);
    if (tagQuery) {
      setSelectedTagEdit(tagQuery);
      setName(tagQuery.name);
      document.title = tagQuery.name;
    }
  }, [tags, id]);

  const deleteTag = useCallback(async () => {
    if (selectedTagDelete) {
      await userRequest
          .delete("tags/" + selectedTagDelete._id)
          .then(() => {
            getTags();
          })
          .catch(function (err) {
            handleRequestErrorAlert(err);
            setErrors({ message: err.response?.data?.error});
          });
      setChoiceModalDelete(false);
    }
  }, [selectedTagDelete, getTags]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteTag();
    }
  }, [choiceModalDelete, deleteTag]);

  const validateForm = () => {
    const errors = {};
    if (!name) errors.name = "Naziv taga je obavezan!";
    return errors;
  };

  async function saveTag(ev) {
    ev.preventDefault();
    setErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    if (selectedTagEdit) {
      //editing
      await userRequest
        .put("tags/" + selectedTagEdit._id, {
          name: name,
        }).then(() => {
          setName("");
          setSelectedTagEdit(null);
          getTags();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error});
        });
      setSelectedTagEdit(null);
    } else {
      await userRequest
        .post("tags", {
          name: name,
        }).then(() => {
          setName("");
          getTags();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error});
        });
    }
  }

  function sortingCreatedAt() {
    if (!sortOrder) {
      filteredTags.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
    } else {
      filteredTags.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    }
    setSortBy('createdAt');
    setSortOrder(!sortOrder);
  }

  function sortingName() {
    if (!sortOrder) {
      filteredTags.sort((a, b) => (a.name > b.name ? 1 : -1));
    } else {
      filteredTags.sort((a, b) => (b.name > a.name ? 1 : -1));
    }
    setSortBy('name');
    setSortOrder(!sortOrder);
  }

  const filterByName = (event) => {
    const query = event.target.value;
    if (query.trim().length === 0) {
      setFilteredTags(tags);
    } else {
      var updatedList = [...tags];
      updatedList = updatedList.filter((item) => {
        return item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
      });
      setFilteredTags(updatedList);
    }
  };

  const sectionsInfo = [
    {
      icon: <AiFillEdit size={20} title="Izmeni" />,
      text: "Izmeni tag",
      buttonClass: "edit"
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši tag",
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
        <h1 className="text-xl text-color font-bold">TAGOVI</h1>
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
        <form onSubmit={saveTag}>
          <div className="my-1 flex items-center w-full">
              <input
                className="input-field w-1/4"
                type="text"
                value={name}
                placeholder="Naziv novog taga"
                onChange={(ev) => setName(ev.target.value)}
              />
              <div className="flex ml-1">
                <button
                  type="submit"
                  className="button-basic"
                >
                  {selectedTagEdit ? `Izmeni` : "Kreiraj"}
                </button>
                <button
                  key={selectedTagEdit?._id}
                  className="button-default ml-1"
                  type="button"
                  onClick={() => {
                    setSelectedTagEdit(null);
                    setName("");
                    setErrors({});
                  }}
                >
                  Otkaži
                </button>
              </div>        
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
          {sortBy === 'createdAt' && sortOrder ? (
            <BiSolidDownArrowAlt className="arrow" />
          ) : (
            <BiSolidUpArrowAlt className="arrow" />
          )}
          </span>
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-240px)]">
        <ul>
          {filteredTags.map((tag, id) => (
            <li
              key={id}
              className={`rounded-lg border p-1 pl-2 grid grid-cols-3 items-center justify-between cursor-pointer ${tag._id === selectedTagEdit?._id ? 'bg-teal-200' : 'bg-white hover:bg-gray-50'}`}
              onDoubleClick={() => {
                setSelectedTagEdit(tag);
                setName(tag.name);
                setErrors({});
              }}
            >          
              <p>{tag.name}</p>
              <p className="hidden sm:flex">
                {date.format(new Date(tag.createdAt), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <button
                  className={"button-edit"}
                  onClick={() => {
                    setSelectedTagEdit(tag);
                    setName(tag.name);
                    setErrors({});
                  }}
                >
                  <AiFillEdit size={20} title="Izmeni" />
                </button>
                <button
                  className={"button-delete ml-1"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedTagDelete(tag);
                  }}
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
          modalMessage={`Da li želite obrisati tag: ${selectedTagDelete.name}?`}
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

export default Tags;
