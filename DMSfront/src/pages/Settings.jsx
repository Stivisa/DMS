import React, { useEffect, useState, useCallback } from "react";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { userRequest } from "../utils/requestMethods";
import DeleteModal from "../components/modal/DeleteModal";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import { useDispatch, useSelector } from "react-redux";
import { FaCheck } from "react-icons/fa";

import { setCompany } from "../redux/companyRedux";

const Settings = () => {
  const companyName = useSelector((state) => state.company?.currentCompany?.name);
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [folderName, setFolderName] = useState("");
  const [selectedCompanyDelete, setSelectedCompanyDelete] = useState("");
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [selectedCompanyEdit, setSelectedCompanyEdit] = useState("");

  const dispatch = useDispatch();

  const [errors, setErrors] = useState({});

  const getCompanies = useCallback(
    async () => {
      try {
        const response = await userRequest.get("/companies");
        setCompanies(response.data);
      } catch (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error});
      }
    },
    []
);
  
  useEffect(() => {
    getCompanies();
    document.title = "PODEŠAVANJA";
  }, [getCompanies]);

  const validateForm = () => {
    const errors = {};
    if (!name) errors.name = "Naziv firme je obavezno!";
    if (!folderName) errors.foldername = "Naziv foldera je obavezan!";
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(folderName)) {
      errors.foldernameinvalid = "Naziv foldera sadrži nevažeće znakove! Nedozvoljeni znakovi su: <>:\"/\\|?*";
    }
    return errors;
  };

  async function saveCompany(ev) {
    ev.preventDefault();
    setErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
      if (selectedCompanyEdit) {
        //editing
        await userRequest
          .put("companies/" + selectedCompanyEdit._id, {
            name: name,
            //folderName: folderName,
          }).then(() => {
            setName("");
            setSelectedCompanyEdit("");
            getCompanies();
          })
          .catch(function (err) {
            handleRequestErrorAlert(err);
            setErrors({ message: err.response?.data?.error});
          });
        
      } else {
        await userRequest.post("companies", {
          name,
          folderName: folderName,
        }).then(() => {
          setName("");
          setFolderName("");
          getCompanies();
        }).catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error});
        });
      }
  }

  const deleteCompany = useCallback(async () => {
    if (selectedCompanyDelete) {
      await userRequest
          .delete("companies/" + selectedCompanyDelete._id)
          .then(() => {
            getCompanies();
          })
          .catch(function (err) {
            handleRequestErrorAlert(err);
            setErrors({ message: err.response?.data?.error});
          });
      setChoiceModalDelete(false);
    }
  }, [selectedCompanyDelete, getCompanies]);

   //dugme disabled, treba true onclick
  useEffect(() => {
    if (choiceModalDelete) {
      deleteCompany();
    }
  }, [choiceModalDelete, deleteCompany]);

  return (
    <>
      <div className="px-2 py-1 border-2 border-gray-400 rounded-lg bg-white">   
        <h1 className="text-xl text-color font-bold">FIRME KOJE KORISTE ARHIVU</h1>
        <form onSubmit={saveCompany}>
          <div className="my-1 flex items-center">
              <input
                className="input-field w-1/4"
                type="text"
                value={name}
                placeholder="Naziv nove firme"
                onChange={(ev) => setName(ev.target.value)}
              />   
              <input
                className={`input-field w-1/4 ml-1 ${selectedCompanyEdit._id ? 'bg-gray-400' : ''}`}
                type="text"
                disabled = {selectedCompanyEdit._id}
                value={folderName}
                placeholder="Folder nove firme"
                onChange={(ev) => setFolderName(ev.target.value)}
              />         
              <div className="flex ml-1">
                <button
                  type="submit"
                  className="button-basic"
                >
                  {selectedCompanyEdit ? `Izmeni` : "Kreiraj"}
                </button>
                <button
                  key={selectedCompanyEdit?._id}
                  className="button-default ml-1"
                  type="button"
                  onClick={() => {
                    setSelectedCompanyEdit("");
                    setName("");
                    setFolderName("");
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
      <div className="grid grid-cols-3 items-center justify-between pl-2">
        <div className="flex">
          <span className="font-semibold">Naziv</span>
        </div>    
        <div className="flex">
          <span className="font-semibold">Folder</span>
        </div> 
      </div>
        <ul className="overflow-y-auto h-[calc(100vh-190px)]">
          {companies.map((company, index) => (
            <li
              key={index}
              className={`rounded-lg border p-1 pl-2 grid grid-cols-3 items-center justify-between cursor-pointer ${company._id === selectedCompanyEdit?._id ? 'bg-teal-200' : 'bg-white hover:bg-gray-50'}`}
              onDoubleClick={() => {
                setSelectedCompanyEdit(company);
                setName(company.name);
                setFolderName(company.folderName);
                setErrors({});                
              }}
            > 
              <p>{company.name}</p>   
              <p>{company.folderName}</p>  
              <div className="flex items-center ml-auto">
                <button
                  onClick={() => {
                    dispatch(setCompany(company));
                  }}
                  className={
                    company.name === companyName
                      ? "button-basic"
                      : "button-default"
                  }
                >
                  <FaCheck size={20}
                    title="Izaberi"            
                  />
                </button>
                <button
                  className={"button-edit ml-1"}
                  onClick={() => {
                    setSelectedCompanyEdit(company);
                    setName(company.name);
                    setFolderName(company.folderName);
                    setErrors({});                
                  }}
                >
                  <AiFillEdit title="Izmeni" size={20} className="" />
                </button>
                <button
                  className={"button-delete ml-1"}
                  onClick={() => {
                    setModalOnDelete(false);
                    setSelectedCompanyDelete(company);
                  }}
                >
                  <AiFillDelete title="Obriši" size={20}/>
                </button>
              </div>
            </li>
          ))}
        </ul>    
      {modalOnDelete && (
        <DeleteModal
          setModalOn={setModalOnDelete}
          setChoice={setChoiceModalDelete}
          modalMessage={`Da li želite obrisati firmu: ${selectedCompanyDelete.name}?`}
        />
      )}
    </>
  );
};
export default Settings;
