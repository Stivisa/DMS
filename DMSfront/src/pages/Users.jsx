import React, { useEffect, useState, useCallback} from "react";
import { BsInfoCircle } from "react-icons/bs";
import { BiSolidDownArrowAlt, BiSolidUpArrowAlt } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { RiAdminFill } from "react-icons/ri";
import { userRequest } from "../utils/requestMethods";
import date from "date-and-time";
import DeleteModal from "../components/modal/DeleteModal";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import InfoModal from "../components/modal/InfoModal";
import SearchFilter from "../components/SearchFilter";
import { PiEye, PiEyeSlash } from "react-icons/pi";

const Users = () => {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserDelete, setSelectedUserDelete] = useState(null);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modalOnInfo, setModalOnInfo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(true);

  const getUsers = useCallback(async () => {
    try {
        const response = await userRequest.get("users");
        setUsers(response.data);
        setFilteredUsers(response.data);
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error});
    }
  }, []);

  useEffect(() => {
      getUsers();
      document.title = "KORISNICI";
  }, [getUsers]);

  const deleteUser = useCallback(async () => {
    if (selectedUserDelete) {
      await userRequest
          .delete("users/" + selectedUserDelete._id)
          .then(() => {
            getUsers();
          })
          .catch(function (err) {
            handleRequestErrorAlert(err);
            setErrors({ message: err.response?.data?.error});
          });
      setChoiceModalDelete(false);
    }
  }, [selectedUserDelete, getUsers]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteUser();
    }
  }, [choiceModalDelete, deleteUser]);

  const validateForm = () => {
    const errors = {};
    if (!username) errors.username = "Korisničko ime je obavezno!";
    if (!password) errors.password = "Šifra je obavezna!";
    return errors;
  };

  async function saveUser(ev) {
    ev.preventDefault();
    setErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
      await userRequest
        .post("auth/register", {
          username: username,
          password: password,
        })
        .then(() => {
          setUsername("");
          setPassword("");
          getUsers();
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error});
        });
  }

  async function updateUserAdmin(event, user) {
    event.preventDefault();
    await userRequest
      .put("users/" + user._id, {
        isAdmin: !user.isAdmin,
      })
      .catch(function (error) {
        handleRequestErrorAlert(error);
      });
    getUsers();
  }

  function sortingCreatedAt() {
    if (!sortOrder) {
      filteredUsers.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
    } else {
      filteredUsers.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    }
    setSortBy('createdAt');
    setSortOrder(!sortOrder);
  }

  function sortingName() {
    if (!sortOrder) {
      filteredUsers.sort((a, b) => (a.username > b.username ? 1 : -1));
    } else {
      filteredUsers.sort((a, b) => (b.username > a.username ? 1 : -1));
    }
    setSortBy('name');
    setSortOrder(!sortOrder);
  }

  const filterByName = (event) => {
    const query = event.target.value;
    console.log(query);
    if (query.trim().length === 0) {
      setFilteredUsers(users);
    } else {
      var updatedList = [...users];
      updatedList = updatedList.filter((item) => {
        return item.username.toLowerCase().indexOf(query.toLowerCase()) !== -1;
      });
      setFilteredUsers(updatedList);
    }
  };

  const sectionsInfo = [
    {
      icon: <RiAdminFill size={20} title="Admin" />,
      text: "Dodeli korisniku prava admina",
      buttonClass: "basic"
    },
    {
      icon: <AiFillDelete size={20} title="Obriši" />,
      text: "Obriši korisnika",
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
        <div className=" w-full flex justify-between items-center">
          <h1 className="text-xl text-color font-bold">KORISNICI</h1>
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
        <form onSubmit={saveUser}>
          <div className="my-1 flex items-center w-full">
              <input
                className="input-field w-1/4"
                type="text"
                value={username}
                placeholder="Korisničko ime novog korisnika"
                onChange={(ev) => setUsername(ev.target.value)}
              />
              <div className="flex items-center w-1/4 relative">
                <input
                  value={password}
                  placeholder="Šifra novog korisnika"
                  className="input-field w-full ml-1 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-0 p-3 m-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <PiEye className="h-5 w-5 text-gray-500" />
                  ) : (
                    <PiEyeSlash className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              <div className="flex ml-1">
              <button
                  type="submit"
                  className="button-basic"
                >
                  Kreiraj
                </button>
                <button
                  className="button-default ml-1"
                  type="button"
                  onClick={() => {
                    setUsername("");
                    setPassword("");
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
          Korisničko ime
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
          {filteredUsers.map((user, id) => (
            <li
              key={id}
              className="bg-white hover:bg-gray-50 rounded-lg border p-1 pl-2 grid grid-cols-3 items-center justify-between"
            >
              <p>{user.username}</p>
              <p className="hidden sm:flex">
                {date.format(new Date(user.createdAt), "DD-MM-YYYY ")}
              </p>
              <div className="flex ml-auto">
                <button
                  onClick={(event) => {
                    updateUserAdmin(event, user);
                  }}
                  className={
                    user.isAdmin === true
                      ? "button-basic"
                      : "button-default"
                  }
                >
                  <RiAdminFill
                    title="Admin"
                    size={20}
                  />
                </button>
                <button
                  className={"button-delete ml-1"}
                  onClick={() => {
                    setModalOnDelete(true);
                    setSelectedUserDelete(user);
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
        <DeleteModal
          setModalOn={setModalOnDelete}
          setChoice={setChoiceModalDelete}
          modalMessage={`Da li želite obrisati korisnika: ${selectedUserDelete.username}?`}
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

export default Users;
