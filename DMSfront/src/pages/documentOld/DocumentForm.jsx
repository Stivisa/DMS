import React, { useState, useEffect } from "react";
import { userRequest } from "../../utils/requestMethods";
import { FiUpload, FiDownload } from "react-icons/fi";
import { IoDocument } from "react-icons/io5";
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";
import {
  handleRequestErrorAlert,
} from "../../utils/errorHandlers";
import ModalFolderContent from "../../components/ModalFolderContent";

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
  isFolder : existingIsFolder
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
  const [isFolder, setIsFolder] = useState(existingIsFolder ||false);

  const [formData, setFormData] = useState(new FormData());

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
    //document.title = name;
    userRequest
      .get("categories")
      .then((response) => {
        setCategoriesAll(response.data);
      })
      .catch(function (error) {
        handleRequestErrorAlert(error);
      });
    userRequest
      .get("tags")
      .then((response) => {
        setTagsAll(response.data);
      })
      .catch(function (error) {
        handleRequestErrorAlert(error);
      });
    userRequest
      .get("clients")
      .then((response) => {
        setClientsAll(response.data);
      })
      .catch(function (error) {
        handleRequestErrorAlert(error);
      });
    userRequest
      .get("years")
      .then((response) => {
        setYearsAll(response.data);
      })
      .catch(function (error) {
        handleRequestErrorAlert(error);
      });
  }, []);

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
      fileNameUpload,
      fileSize,
      content,
      physicalLocation,
      isFolder,
    };
    
    if (_id) {
      await userRequest
        .put("documents/" + _id, {
          requestBody
        })
        .then((response) => {
          //setFilePath(response.data.filePath);
          navigate("/documents");
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
        await userRequest.post('documents/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(response => {
          if (response.status === 200) {
            console.log('Folder uploaded successfully.');
          }
          navigate("/documents");
        })
        .catch(error => {
          handleRequestErrorAlert(error);
        });
      /*
      await userRequest
        .post("documents", {
          requestBody
        })
        .catch(function (error) {
          handleRequestErrorAlert(error);
        });
        */
    }
    
  }

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

  const handleFileInput = (event) => {
    const file = event.target.files[0]; 
    const formDataTemp = new FormData();
    //automatski popunjavano name samo kod kreiranja novog dokumenata, ne i kod izmena
    if (!fileName) {
      const fileNameTemp = file.name;
      setFileNameUpload(fileNameTemp);
      setIsFolder(false);
      setName(fileNameTemp.substring(0, fileNameTemp.lastIndexOf(".")));
      
      formDataTemp.append('fileName', fileNameTemp);
      formDataTemp.append('files', file);  // Append the file to the FormData object
      
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileSize(fileSizeInMB);

      setFormData(formDataTemp);  // Assuming setFormData is a function to set the FormData object in your state
    }
  };

  const handleFolderInput = (event) => {
    const files = event.target.files;
    const formDataTemp = new FormData();
    if (files.length > 0) {
      const folderPath = event.target.files[0].webkitRelativePath || event.target.files[0].mozFullPath || event.target.files[0].name;
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
  };

  async function downloadFile(ev) {
    ev.preventDefault();
    
    try {
      const response = await userRequest.get('documents/file/download', {
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
      const response = await userRequest.get('documents/file/download', {
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
      const response = await userRequest.get(`documents/folder/${_id}`, {
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
      const response = await userRequest.get(`documents/folder-contents/${_id}`);
      setFiles(response.data);
      setShowModalFolderContent(true);
    } catch (error) {
      console.error("Error fetching folder contents:", error);
    }
  };

  return (
    <div className="bg-gray-200 px-2 justify-center">
      <div className="w-full p-1 rounded-lg bg-white overflow-y-auto ">
        <h1 className="mb-2 text-xl font-bold text-center">
          {_id ? "Izmeni" : "Dodaj"} dokument
        </h1>
        <form onSubmit={saveDocument}>
          <div className="grid grid-cols-2 gap-6 justify-center border border-t-0 border-b-0 border-l-0 border-r">
            <div className="col-span-1 grid grid-cols-2 place-items-end">
              <div></div>
              <div className="">
                <h1 className="text-center italic font-light">
                  Obavezna polja
                </h1>              
                {!fileName && (
                  <><div className="mt-2 mb-2 flex w-1/2 sm:w-80">
                    <label className={`p-2 rounded-md border  text-center flex items-center justify-center ${
                              folderNameUpload !== '' ? 'text-gray-400 bg-gray-300 border-gray-400 cursor-not-allowed' : 'text-purple-800 bg-purple-300 border-purple-800 cursor-pointer'
                          }`}>
                      <FiUpload className="text-2xl" />
                      <div>Otpremi fajl</div>
                      <input
                        className="hidden"
                        spellCheck="false"
                        type="file"
                        //multiple
                        disabled={folderNameUpload === '' ? false : true}
                        onChange={handleFileInput} />
                    </label>
                    <label className="ml-auto flex items-center justify-center"> ili </label>
                    <label className={`ml-auto p-2 rounded-md border text-center flex items-center justify-center ${
                            fileNameUpload !== '' ? 'text-gray-400 bg-gray-300 border-gray-400 cursor-not-allowed' : 'text-purple-800 bg-purple-300 border-purple-800 cursor-pointer'
                        }`}>
                      <FiUpload className="text-2xl" />
                      <div>Otpremi folder</div>
                      <input
                        className="hidden"
                        spellCheck="false"
                        type="file"
                        directory =""
                        webkitdirectory = "true"
                        disabled={fileNameUpload === '' ? false : true}
                        //multiple
                        onInput={handleFolderInput} />
                    </label>
                  </div>         
                  {fileNameUpload && (
                    <div className="text-center justify-center p-2 break-all">
                      <label className="italic">Fajl: {fileNameUpload}</label>                  
                  </div>
                  )} 
                  {folderNameUpload && (
                    <div className="text-center justify-center p-2 break-all">                  
                      <label className="italic">Folder: {folderNameUpload}</label>                
                  </div>
                  )} 
                    </>              
                )}
                {filePath && (
                  <>
                    <div className="flex w-full sm:w-80 font-bold italic break-all">
                      Sačuvano: {fileName}
                    </div>
                    <div className="flex mt-1">
                      <button
                        onClick={!isFolder ? downloadFile : downloadFolder}                      
                        className=" bg-white text-purple-800 border border-purple-800 rounded-md p-2 cursor-pointer text-center flex items-center justify-center"
                      >
                        <FiDownload className="text-2xl" />
                        {!isFolder ? "Preuzmi fajl" : "Preuzmi folder"}
                      </button>
                      {(fileExt === "pdf" || isFolder) && (
                        <button
                          onClick={fileExt === "pdf" ? previewPdf : fetchFolderContents}
                          className="ml-1 bg-white text-purple-800 border border-purple-800 rounded-md p-2 cursor-pointer text-center flex items-center justify-center"
                        >
                          <IoDocument className="text-2xl" />
                          {fileExt === "pdf" ? "Pregledaj pdf" : "Pregledaj folder"}
                        </button>
                      )}
                    </div>
                  </>
                )}
                <label>Naziv dokumenta</label>
                <input
                  className="flex w-full sm:w-80 shadow border rounded py-2 px-2 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
                  type="text"
                  value={name}
                  placeholder="Naziv"
                  onChange={(ev) => {
                    setName(ev.target.value);
                  }}
                />
                <label>Godina nastanka</label>
                <div className="flex justify-between items-center">
                  <select
                    className="flex w-36 shadow border rounded py-2 px-1 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
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
                <label>Klasifikacija</label>
                <select
                  className="flex w-full sm:w-80 shadow border rounded py-2 px-1 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
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
                <label>Sadržaj</label>
                <textarea
                  className="flex h-12 w-full sm:w-80 shadow border rounded py-2 px-3 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
                  spellCheck="false"
                  placeholder="Sadržaj polje iz arhivske knjige"
                  value={content}
                  onChange={(ev) => setContent(ev.target.value)}
                />
              </div>
            </div>
            <div className="col-span-1 grid grid-cols-2 place-items-start just">
              <div className="col-span-1">
                <h1 className="text-center italic font-light">Dodatna polja</h1>
                <label>Komitent</label>
                <select
                  className="flex w-full sm:w-80 shadow rounded py-2 px-1 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
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
                <label>Tagovi</label>
                <select
                  className="flex w-full sm:w-80 shadow border rounded py-2 px-1 mb-1 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
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
                <div className="flex flex-wrap w-full sm:w-80">
                  {tagsAll.length > 0 &&
                    tags.length > 0 &&
                    tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex py-1 px-1 mr-1 text-white bg-purple-600 rounded-md items-center"
                      >
                        <button
                          type="button"
                          onClick={() => removeTagFromProduct(tag)}
                          key={tag}
                          className="flex text-xl py-0 px-0 text-white transition-colors duration-150 bg-red-500 rounded-md hover:bg-red-600 items-center"
                        >
                          <AiOutlineClose className="" />
                        </button>
                        <button
                          className="flex py-0 px-0 ml-1 items-center"
                          onClick={(ev) => {
                            ev.preventDefault();
                            window.open(
                              "/tags/" + tag,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                        >
                          <p className="underline">
                            {getTagNameById(tag) /*tag*/}
                          </p>
                        </button>
                      </div>
                    ))}
                </div>
                <label>Opis</label>
                <textarea
                  className="flex h-12 w-full sm:w-80 shadow border rounded py-2 px-3 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
                  spellCheck="false"
                  placeholder="Opis dokumenta za dodatnu pretragu"
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                />
                <label>Fizička lokacija</label>
                <textarea
                  className="flex h-12 w-full sm:w-80 shadow border rounded py-2 px-3 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
                  spellCheck="false"
                  placeholder="Lokacija odštampanog dokumenta"
                  value={physicalLocation}
                  onChange={(ev) => setPhysicalLocation(ev.target.value)}
                />
              </div>
            </div>
            <div></div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className=" text-white bg-purple-800 p-2 mt-4 rounded-md"
            >
              Sačuvaj
            </button>
            <Link to="/documents">
              <button
                className="text-black border border-black hover:bg-gray-200 p-2 mt-4 ml-1 rounded-md"
                type="button"
              >
                Otkaži
              </button>
            </Link>
          </div>
        </form>
      </div>
      <ModalFolderContent
        show={showModalFolderContent}
        handleClose={() => setShowModalFolderContent(false)}
        files={files}
        folderId={_id}
      />
    </div>
  );
};

export default DocumentForm;
