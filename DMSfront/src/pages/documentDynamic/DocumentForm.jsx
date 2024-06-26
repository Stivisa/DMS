import React, { useState, useEffect, useCallback } from "react";
import { userRequest } from "../../utils/requestMethods";
import { FiUpload, FiDownload } from "react-icons/fi";
import { IoDocument } from "react-icons/io5";
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";
import {
  handleRequestErrorAlert,
} from "../../utils/errorHandlers";
import ModalFolderContent from "../../components/modal/FolderContentModal";
import DeleteModal from "../../components/modal/DeleteModal";

const DocumentForm = ({
  _id,
  name: existingName,
  filePath: existingFilePath,
  description: existingDescription,
  category: existingCategory,
  tags: existingTags,
  client: existingClient,
  yearStart: existingYearStart,
  content: existingContent,
  physicalLocation : existingPhysicalLocation,
  isFolder : existingIsFolder,
  isDeleted : existingIsDeleted,
}) => {
  const [name, setName] = useState(existingName || "");
  const [filePath] = useState(existingFilePath || "");
  const [description, setDescription] = useState(existingDescription || "");
  const [content, setContent] = useState(existingContent || "");
  const [categoriesAll, setCategoriesAll] = useState([]);
  const [category, setCategory] = useState(existingCategory || undefined);
  const [tagsAll, setTagsAll] = useState([]);
  const [tags, setTags] = useState(existingTags || []);
  const [clientsAll, setClientsAll] = useState([]);
  const [client, setClient] = useState(existingClient || undefined);
  const [yearsAll, setYearsAll] = useState([]);
  const [yearStart, setYearStart] = useState(existingYearStart || undefined);
  const [physicalLocation, setPhysicalLocation] = useState(existingPhysicalLocation || "");

  const [errors, setErrors] = useState({});

  const [isFolder, setIsFolder] = useState(existingIsFolder ||false);

  const [formData, setFormData] = useState(new FormData());

  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);
  const [modalOnRecycle, setModalOnRecycle] = useState(false);
  const [choiceModalRestore, setChoiceModalRestore] = useState(false);

  //ime otpremljenog foldera
  const [folderNameUpload, setFolderNameUpload] = useState('');

  const [fileSize, setFileSize] = useState("");
  //pomocne promenljive
  //fileNameUpload je ime otpremljenog fajla, , salje se serveru za snimanje i prikazuje za uvid
  const [fileNameUpload, setFileNameUpload] = useState("");
  //fileName je ime.ekstenzija sacuvanog fajla na serveru
  const [fileName] = useState(filePath?.split("\\").pop() || "");
  //fileExt je ekstenzija sacuvanog fajl, a ne trenutno ucitanog za otpremanje
  const fileExtension = filePath.includes(".") ? filePath.split(".").pop() : "";
  const [fileExt] = useState(fileExtension);

  const [showModalFolderContent, setShowModalFolderContent] = useState(false);
  const [files, setFiles] = useState([]);


  const navigate = useNavigate();

  useEffect(() => {
    document.title = "DOKUMENT " + name || "BARISTA DMS";
  }, [name]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await userRequest.get("categories");
        setCategoriesAll(response.data);
      } catch (err) {
        setErrors({ message: err.response?.data?.error});
      }
    };
  
    const fetchTags = async () => {
      try {
        const response = await userRequest.get("tags");
        setTagsAll(response.data);
      } catch (err) {
        setErrors({ message: err.response?.data?.error});
      }
    };
  
    const fetchClients = async () => {
      try {
        const response = await userRequest.get("clients");
        setClientsAll(response.data);
      } catch (err) {
        setErrors({ message: err.response?.data?.error});
      }
    };
  
    const fetchYears = async () => {
      try {
        const response = await userRequest.get("years");
        setYearsAll(response.data);
      } catch (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error});
      }
    };
  
    const fetchData = async () => {
      await Promise.all([fetchCategories(), fetchTags(), fetchClients(), fetchYears()]);
    };
  
    fetchData();
  }, [navigate]);

  async function saveDocument(ev) {
    ev.preventDefault();
    const requestBody = {
      name,
      filePath,
      description,
      category,
      client,
      tags,
      yearStart,
      fileSize,
      content,
      physicalLocation,
      isFolder,
    };
    
    if (_id) {
      await userRequest
        .put("document/" + _id, {
          requestBody
        })
        .then((response) => {
          if(response.data.isDeleted === true) {
            console.log('lalala');
            navigate("/recyclebin");
          } else {
            navigate("/document");
          }
        })
        .catch(function (error) {
          handleRequestErrorAlert(error);
        });
    } else {
        if ( fileNameUpload === "" && folderNameUpload === '') {
          alert("Folder/fajl ne moze biti prazan!");
          return;
        }
        for (const [fieldName, fieldValue] of Object.entries(requestBody)) {
          formData.append(fieldName, fieldValue);
        }     
        await userRequest.post('document/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(response => {
          if (response.status === 200) {
            console.log('Folder uploaded successfully.');
          }
          navigate("/document");
        })
        .catch(error => {
          //setFileNameUpload('');
          //setFolderNameUpload('');
          handleRequestErrorAlert(error);
        });   
      }  
  }

  const deleteProduct = useCallback(async () => {
      await userRequest
          .put("document/recycle/" + _id, {
            filePath: filePath,
          }).then(() => {
            setChoiceModalDelete(false);
            navigate("/document");
          })
          .catch(function (error) {
            handleRequestErrorAlert(error);
          });   
  }, [_id, filePath, navigate]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteProduct();
    }
  }, [choiceModalDelete, deleteProduct]);

  const restoreProduct = useCallback(async () => {
      await userRequest
        .put("document/restore/" + _id, {
          filePath: filePath,
        })
        .then(() => {
            setChoiceModalRestore(false);
            navigate("/recyclebin");
          })
          .catch(function (error) {
            handleRequestErrorAlert(error);
          });   
  }, [_id, filePath, navigate]);

  useEffect(() => {
    if (choiceModalRestore) {
      restoreProduct();
    }
  }, [choiceModalRestore, restoreProduct]);

  function addTagToProduct(selected) {
    const selectedTag = tagsAll[selected];
    //if product already have that property, skip
    const isFound = tags.some((tag) => {
      if (tag === selectedTag._id) {
        return true;
      }
      return false;
    });
    if (!isFound) {
      const newTags = [...tags, selectedTag._id];
      setTags(newTags);
    }
  }

  function removeTagFromProduct(removeId) {
    const newTags = tags.filter((tag) => {
      return tag !== removeId;
    });
    setTags(newTags);
  }

  //SECOND OPTION populate tags on api get with id, than tag.name, it will skip id without name (deleted tags)
  //BETTER OPTION *only without populate tag, if you dont find name for some tag id, that means tag is deleted, and should remove id from product.tags
  //MUST for newly live added tags, must search name in tagsAll beacause we adding only tag id to products
  function getTagNameById(currentTagId) {
    const tag = tagsAll.find((tag) => tag._id === currentTagId);
    if (tag) {
      return tag.name;
    } else {
      const deletedTagIndex = tags.indexOf(currentTagId);
      tags.splice(deletedTagIndex, 1);
      return;
    }
  }

  const handleFileInput = useCallback((event) => {
    const file = event.target.files[0];
    const formDataTemp = new FormData();
    // automatically populate name only when creating a new document, not when editing
    if (!fileName) {
      const fileNameTemp = file.name;
      setFileNameUpload(fileNameTemp);
      setIsFolder(false);
      setName(fileNameTemp.substring(0, fileNameTemp.lastIndexOf(".")));
  
      formDataTemp.append('fileName', fileNameTemp);
      formDataTemp.append('files', file);
  
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileSize(fileSizeInMB);
  
      setFormData(formDataTemp);
    }
  }, [fileName]);

const handleFolderInput = useCallback((event) => {
  const files = event.target.files;
  const formDataTemp = new FormData();
  if (files.length > 0) {
    const folderPath = files[0].webkitRelativePath || files[0].mozFullPath || files[0].name;
    const folderNameTemp = folderPath.split('/')[0];
    setFolderNameUpload(folderNameTemp);
    setIsFolder(true);
    formDataTemp.append('folderName', folderNameTemp);
    if (!fileName) {
      setName(folderNameTemp);
    }
  }
  let totalSize = 0;
  for (let file of files) {
    formDataTemp.append('files', file);
    totalSize += file.size;
  }
  const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
  setFileSize(totalSizeInMB);
  setFormData(formDataTemp);
}, [fileName]);


  async function downloadFile(ev) {
    ev.preventDefault();
    
    try {
      const response = await userRequest.get('document/file/download', {
        params: {
          id: _id,
        },
        responseType: 'blob',
      });
  
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
  
      downloadLink.href = downloadUrl;
      downloadLink.download = fileName; // Assuming `fileName` contains the desired name of the file
      downloadLink.click();
  
      window.URL.revokeObjectURL(downloadUrl); // Clean up
    } catch (error) {
      handleRequestErrorAlert(error);
    }
  }

  async function previewPdf(ev) {
    ev.preventDefault();
    
    try {
      const response = await userRequest.get('document/file/download', {
        params: {
          id: _id,
        },
        responseType: 'blob',
      });
  
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const dataUrl = URL.createObjectURL(blob);
      
      window.open(dataUrl, "_blank");
      
      // Clean up the object URL after some time
      setTimeout(() => {
        URL.revokeObjectURL(dataUrl);
      }, 10000); // Adjust the time as necessary
  
    } catch (error) {
      handleRequestErrorAlert(error);
    }
  }

  async function downloadFolder(ev) {
    ev.preventDefault();
    
    try {
      const response = await userRequest.get(`document/folder/${_id}`, {
        responseType: 'blob',
      });
  
      const blob = new Blob([response.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
  
      downloadLink.href = downloadUrl;
      downloadLink.download = `${fileName}.zip`;
      downloadLink.click();
  
      window.URL.revokeObjectURL(downloadUrl); // Clean up
    } catch (error) {
      handleRequestErrorAlert(error);
    }
  }

  const fetchFolderContents = async (ev) => {
    ev.preventDefault();
    try {
      const response = await userRequest.get(`document/folder-contents/${_id}`);
      setFiles(response.data);
      setShowModalFolderContent(true);
    } catch (error) {
      console.error("Error fetching folder contents:", error);
    }
  };

  return (
    <>
      <div className="w-full rounded-lg bg-white overflow-y-auto">
        <h1 className="text-color my-2 text-xl font-bold text-center">
          {_id ? "IZMENI" : "DODAJ"} DOKUMENT
        </h1>
        <form onSubmit={saveDocument}>
          <div className="flex justify-center gap-8 mx-8">
            <div className="w-1/3">
                <div className="w-full">
                  <h1 className="text-color text-xl text-center italic font-semibold border-b-2">
                    Obavezna polja
                  </h1>
                  {!fileName && (
                    <div className="w-full border-b-2">
                      <div className="my-1 gap-2 flex">
                        <label className="button-basic bg-purple-500 hover:bg-purple-600 items-center flex justify-center">
                          <FiUpload className="flex text-2xl" />
                          <div className="text-center">Otpremi fajl</div>
                          <input
                            className="hidden"
                            spellCheck="false"
                            type="file"
                            onClick={(event) => {
                              event.target.value = null;
                            }}
                            onInput={handleFileInput}
                          />
                        </label>
                        <label className="button-basic bg-purple-500 hover:bg-purple-600 items-center flex justify-center">
                          <FiUpload className="flex text-2xl" />
                          <div className="text-center">Otpremi folder</div>
                          <input
                            className="hidden"
                            spellCheck="false"
                            type="file"
                            directory=""
                            webkitdirectory="true"
                            onClick={(event) => {
                              event.target.value = null;
                            }}
                            onInput={handleFolderInput}
                          />
                        </label>
                      </div>
                      <div className="break-all italic font-semibold text-gray-800 text-lg">
                        {fileNameUpload && (
                          <div className="p-2">Fajl: {fileNameUpload}</div>
                        )}
                        {folderNameUpload && (
                          <div className="p-2">Folder: {folderNameUpload}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {filePath && (
                    <div className="w-full border-b-2">
                      <div className="break-all italic font-semibold text-gray-800 p-2 text-lg">
                        Sačuvano: {fileName}
                      </div>
                      <div className="my-1 gap-2 flex">
                        <button
                          onClick={!isFolder ? downloadFile : downloadFolder}
                          className="button-basic bg-purple-500 hover:bg-purple-600 items-center flex justify-center"
                        >
                          <FiDownload className="text-2xl" />
                          {!isFolder ? "Preuzmi fajl" : "Preuzmi folder"}
                        </button>
                        {(fileExt === "pdf" || isFolder) && (
                          <button
                            onClick={
                              fileExt === "pdf" ? previewPdf : fetchFolderContents
                            }
                            className="button-basic bg-purple-500 hover:bg-purple-600 items-center flex justify-center"
                          >
                            <IoDocument className="text-2xl" />
                            {fileExt === "pdf"
                              ? "Pregledaj pdf"
                              : "Pregledaj folder"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="py-2">
                  <label>Naziv dokumenta</label>
                  <input
                    className="input-field flex w-full"
                    type="text"
                    value={name}
                    placeholder="Naziv"
                    onChange={(ev) => {
                      setName(ev.target.value);
                    }}
                  />
                  </div>
                  <div className="pb-2"> 
                  <label>Godina nastanka</label>  
                  <select
                      className="input-field flex w-1/4"
                      value={yearStart}
                      onChange={(ev) => setYearStart(ev.target.value)}
                    >
                      {yearsAll.length > 0 &&
                        yearsAll.map((year) => (
                          <option key={year._id} value={year.value}>
                            {year.value}
                          </option>
                        ))}
                  </select>
                  </div>
                  <div className="pb-2"> 
                  <label>Klasifikacija (kategorija)</label>
                  <select
                    className="input-field flex w-full"
                    value={category}
                    onChange={(ev) => setCategory(ev.target.value)}
                  >
                    <option value="">--</option>
                    {categoriesAll.length > 0 &&
                      categoriesAll.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                  </div>
                  <div>
                  <label>Sadržaj</label>
                  <textarea
                    className="input-field flex h-16 w-full"
                    spellCheck="false"
                    placeholder="Sadržaj polje iz arhivske knjige"
                    value={content}
                    onChange={(ev) => setContent(ev.target.value)}
                  />
                  </div>
                </div>
            </div>
            <div className="w-1/3">
              <div className="w-full">
                <h1 className="text-color text-xl text-center italic font-semibold border-b-2">
                  Dodatna polja
                </h1>
                <div className="py-2">
                <label>Komitent</label>
                <select
                  className="input-field flex w-full"
                  value={client}
                  onChange={(ev) => setClient(ev.target.value)}
                >
                  <option value="">--</option>
                  {clientsAll.length > 0 &&
                    clientsAll.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                </select>
                </div>
                <div className="pb-2">
                <label>Tagovi</label>
                <select
                  className="input-field flex w-full"
                  value=""
                  onChange={(ev) => addTagToProduct(ev.target.value)}
                >
                  <option value="">--</option>
                  {tagsAll.length > 0 &&
                    tagsAll.map((tag, k) => (
                      <option key={tag._id} value={k}>
                        {tag.name}
                      </option>
                    ))}
                </select>
                <div className="flex flex-wrap w-full mt-1">
                  {tagsAll.length > 0 &&
                    tags.length > 0 &&
                    tags.map((tag) => (
                      <div
                        key={tag}
                        className="items-center flex mr-1"
                      >
                        <button
                          type="button"
                          onClick={() => removeTagFromProduct(tag)}
                          key={tag}
                          className="button-default p-1 z-10"
                        >
                          <AiOutlineClose />
                        </button>
                        <button
                          className="button-edit p-0 pl-6 pr-2 -ml-5"
                          onClick={(ev) => {
                            ev.preventDefault();
                            window.open(
                              "/tags/" + tag,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                        >
                          <p className="underline">{getTagNameById(tag)}</p>
                        </button>
                      </div>
                    ))}
                </div>
                </div>
                <label>Opis</label>
                <textarea
                  className="input-field flex h-16 w-full"
                  spellCheck="false"
                  placeholder="Opis dokumenta za dodatnu pretragu"
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                />
                <label>Fizička lokacija (odštampanog dokumenta)</label>
                <textarea
                  className="input-field flex h-16 w-full"
                  spellCheck="false"
                  placeholder="Lokacija odštampanog dokumenta"
                  value={physicalLocation}
                  onChange={(ev) => setPhysicalLocation(ev.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center py-4 gap-8">
            <button type="submit" className="button-basic px-8">
              Sačuvaj
            </button> 
            <Link to={!existingIsDeleted ? "/document" : "/recyclebin"}>
              <button className="button-default px-8" type="button">
                Otkaži
              </button>
            </Link>
            {_id && !existingIsDeleted && (
            <button type="button" onClick={() => {setModalOnDelete(true);}} className="button-delete text-white px-8">
              Obriši
            </button>
            )}
            {_id && existingIsDeleted && (
            <button type="button" onClick={() => {setModalOnRecycle(true);}} className="button-basic text-teal-400 bg-white border border-teal-400 hover:bg-white hover:text-teal-500 hover:border-teal-500 px-8">
              Obnovi
            </button>
            )}
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
      <ModalFolderContent
        show={showModalFolderContent}
        handleClose={() => setShowModalFolderContent(false)}
        files={files}
        folderId={_id}
      />
      {modalOnDelete && (
        <DeleteModal
          setModalOn={setModalOnDelete}
          setChoice={setChoiceModalDelete}
          modalMessage={`Da li želite obrisati dokument: ${name}?`}
        />
      )}
      {modalOnRecycle && (
        <DeleteModal
          setModalOn={setModalOnRecycle}
          setChoice={setChoiceModalRestore}
          modalMessage={`Da li želite vratiti dokument: ${name}?`}
          color = "green"
        />
      )}
    </>
  );
};

export default DocumentForm;
