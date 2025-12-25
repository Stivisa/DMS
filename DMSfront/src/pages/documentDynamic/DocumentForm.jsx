import React, { useState, useEffect, useCallback } from "react";
import { userRequest } from "../../utils/requestMethods";
import { FiUpload, FiDownload } from "react-icons/fi";
import { IoDocument } from "react-icons/io5";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";
import { handleRequestErrorAlert } from "../../utils/errorHandlers";
import ModalFolderContent from "../../components/modal/FolderContentModal";
import DeleteModal from "../../components/modal/DeleteModal";
import ErrorMessages from "../../components/ErrorMessages";
import CategorySelect from "../../components/CategorySelect";

const DocumentForm = ({
  _id,
  name: existingName,
  filePath: existingFilePath,
  description: existingDescription,
  categories: existingCategories,
  tags: existingTags,
  client: existingClient,
  yearStart: existingYearStart,
  yearEnd: existingYearEnd,
  content: existingContent,
  note: existingNote,
  physicalLocation: existingPhysicalLocation,
  quantity: existingQuantity,
  isFolder: existingIsFolder,
  isDeleted: existingIsDeleted,
  fileSize: existingFileSize,
  errors: existingErrors,
  originDate: existingOriginDate,
  keepDate: existingKeepDate,
  serialNumber: existingSerialNumber,
}) => {
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState(existingName || "");
  const [serialNumber, setSerialNumber] = useState(
    existingSerialNumber || undefined,
  );
  const [filePath] = useState(existingFilePath || "");
  const [description, setDescription] = useState(existingDescription || "");
  const [content, setContent] = useState(existingContent || "");
  const [note, setNote] = useState(existingNote || "");
  const [categoriesAll, setCategoriesAll] = useState([]);
  const [categories, setCategories] = useState(existingCategories || []);
  const [tagsAll, setTagsAll] = useState([]);
  const [tags, setTags] = useState(existingTags || []);
  const [clientsAll, setClientsAll] = useState([]);
  const [client, setClient] = useState(existingClient || undefined);
  const [yearStart, setYearStart] = useState(existingYearStart || currentYear);
  const [yearEnd, setYearEnd] = useState(existingYearEnd || undefined);
  const [physicalLocation, setPhysicalLocation] = useState(
    existingPhysicalLocation || "",
  );
  const [quantity, setQuantity] = useState(existingQuantity || "");
  const [originDate, setOriginDate] = useState(() => {
    return existingOriginDate ? new Date(existingOriginDate) : new Date(); //must new Date(existingOriginDate) because date cant be retrieved from server, only date string in json!
  });
  const [keepDate, setKeepDate] = useState(
    existingKeepDate ? new Date(existingKeepDate) : null,
  );

  const [errors, setErrors] = useState(existingErrors || {});
  const [fileTypeError, setFileTypeError] = useState("");

  const [isFolder, setIsFolder] = useState(existingIsFolder || false);

  const [formData, setFormData] = useState(new FormData());

  const [modalOnRecycle, setModalOnRecycle] = useState(false);
  const [choiceModalRecycle, setChoiceModalRecycle] = useState(false);
  const [modalOnRestore, setModalOnRestore] = useState(false);
  const [choiceModalRestore, setChoiceModalRestore] = useState(false);
  const [modalOnDelete, setModalOnDelete] = useState(false);
  const [choiceModalDelete, setChoiceModalDelete] = useState(false);

  //ime otpremljenog foldera
  const [folderNameUpload, setFolderNameUpload] = useState("");

  const [fileSize, setFileSize] = useState(0); //jer neko polje kad izmenim a nije 0, fail poredjenje velicine poslatog 0 sa velicinom postojeceg koja je >0
  //pomocne promenljive
  //fileNameUpload je ime otpremljenog fajla, , salje se serveru za snimanje i prikazuje za uvid
  const [fileNameUpload, setFileNameUpload] = useState("");
  //fileName je ime.ekstenzija sacuvanog fajla na serveru
  const [fileName] = useState(filePath?.split("\\").pop() || "");
  //fileExt je ekstenzija sacuvanog fajl, a ne trenutno ucitanog za otpremanje
  const fileExtension = filePath.includes(".") ? filePath.split(".").pop().toLowerCase() : "";
  const [fileExt] = useState(fileExtension);

  const [showModalFolderContent, setShowModalFolderContent] = useState(false);
  const [files, setFiles] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = content ? "Dokument " + content : "Dodaj dokument";
  }, [content]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await userRequest.get("categories");
        setCategoriesAll(response.data);
      } catch (err) {
        setErrors({ message: err.response?.data?.error });
      }
    };

    const fetchTags = async () => {
      try {
        const response = await userRequest.get("tags");
        setTagsAll(response.data);
      } catch (err) {
        setErrors({ message: err.response?.data?.error });
      }
    };

    const fetchClients = async () => {
      try {
        const response = await userRequest.get("clients");
        setClientsAll(response.data);
      } catch (err) {
        setErrors({ message: err.response?.data?.error });
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchCategories(), fetchTags(), fetchClients()]);
    };

    fetchData();
  }, [navigate]);

  const validateForm = () => {
    const errors = {};
    //name obavezan ako se arhivira fajl
    //if (fileSize !== 0 && filePath.trim() &&!name.trim()) errors.name = "Naziv dokumenta je obavezan!";
    if (!content.trim()) errors.content = "Sadržaj dokumenta je obavezan!";
    if (
      !serialNumber ||
      isNaN(serialNumber) ||
      parseInt(serialNumber, 10) <= 0
    ) {
      errors.serialNumber =
        "Redni broj dokumenta je obavezan i mora biti veći od 0!";
    }
    if (categories.length === 0)
      errors.category = "Kategorija dokumenta je obavezna!";
    if (!originDate)
      errors.originDate = "Datum nastanka dokumenta je obavezna!";
    if (!yearStart) errors.yearStart = "Godina nastanka dokumenta je obavezna!";
    if (yearStart > yearEnd)
      errors.yearEnd =
        "Godina raspada dokumenta mora biti veća od godine nastanka!";
    if (fileSize === 0 && !filePath.trim() && !physicalLocation.trim())
      errors.physicalLocation =
        "Lokacija dokumenta je obavezna jer ne otpremate fajl!";
    if (fileSize === 0 && !filePath.trim() && !quantity.trim())
      errors.quantity = "Količina dokumenta je obavezna jer ne otpremate fajl!";

    // Check for file type error if it exists
    if (fileTypeError) {
      errors.fileType = fileTypeError;
    }

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
    const requestBody = {
      name,
      filePath,
      serialNumber,
      description,
      categories,
      client,
      tags,
      yearStart,
      yearEnd,
      fileSize,
      content,
      note,
      physicalLocation,
      quantity,
      isFolder,
      originDate,
      keepDate,
    };

    if (_id) {
      for (const [fieldName, fieldValue] of Object.entries(requestBody)) {
        formData.set(fieldName, fieldValue);
      }
      await userRequest
        .put("document/" + _id, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          if (response.data.isDeleted === true) {
            navigate("/recyclebin");
          } else {
            navigate("/document");
          }
        })
        .catch(function (err) {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
    } else {
      //ako se dozvoli otpremanje praznih fajlova, onda mora se u edit omoguciti otpremanje fajla
      /*
        if ( fileNameUpload === "" && folderNameUpload === '') {
          alert("Folder/fajl ne moze biti prazan!");
          return;
        }
        */
      for (const [fieldName, fieldValue] of Object.entries(requestBody)) {
        formData.set(fieldName, fieldValue);
      }
      await userRequest
        .post("document/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          if (response.status === 200) {
            console.log("uploaded successfully");
          }
          navigate("/document");
        })
        .catch((err) => {
          handleRequestErrorAlert(err);
          setErrors({ message: err.response?.data?.error });
        });
    }
  }

  const recycleProduct = useCallback(async () => {
    await userRequest
      .put("document/recycle/" + _id, {
        filePath: filePath,
      })
      .then(() => {
        setChoiceModalRecycle(false);
        navigate("/document");
      })
      .catch(function (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error });
      });
  }, [_id, filePath, navigate]);

  useEffect(() => {
    if (choiceModalRecycle) {
      recycleProduct();
    }
  }, [choiceModalRecycle, recycleProduct]);

  const restoreProduct = useCallback(async () => {
    await userRequest
      .put("document/restore/" + _id, {
        filePath: filePath,
      })
      .then(() => {
        setChoiceModalRestore(false);
        navigate("/recyclebin");
      })
      .catch(function (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error });
      });
  }, [_id, filePath, navigate]);

  useEffect(() => {
    if (choiceModalRestore) {
      restoreProduct();
    }
  }, [choiceModalRestore, restoreProduct]);

  const deleteProduct = useCallback(async () => {
    await userRequest
      .delete("document/" + _id)
      .then(() => {
        setChoiceModalDelete(false);
        navigate("/recyclebin");
      })
      .catch(function (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error });
      });
    setChoiceModalDelete(false);
  }, [_id, navigate]);

  useEffect(() => {
    if (choiceModalDelete) {
      deleteProduct();
    }
  }, [choiceModalDelete, deleteProduct]);

  //single array value for now
  /*
  function addCategory(selected) {
    const selectedCategory = categoriesAll.find(
      (category) => category._id === selected,
    );
    const newCategory = [selectedCategory._id];
    setCategory(newCategory);
    //think this is same as setCategory(selected)
  }
    */

  function addTagToDocument(selected) {
    const selectedTag = tagsAll[selected];
    //if doc already have that property, skip
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
  //in map where this is called add {tagsAll.length >0 && tags.length > 0}, because this is using tagsAll
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

  function addCategoryToDocument(selectedCategoryId) {
    const selectedCategory = categoriesAll.find(
      (category) => category._id === selectedCategoryId,
    );
    // Check if the category is already added
    const isFound = categories.some((categoryId) => categoryId === selectedCategory._id);
    if (!isFound) {
      const newCategories = [...categories, selectedCategory._id];
      setCategories(newCategories);
    }
  }

  function removeCategoryFromDocument(removeCategoryId) {
    const newCategories = categories.filter((categoryId) => categoryId !== removeCategoryId);
    setCategories(newCategories);
  }

  function getCategoryNameById(categoryId) {
    const categoryGet = categoriesAll.find((category) => category._id === categoryId);
    if (categoryGet) {
      return categoryGet.name; // Return the category name if found
    } else {
      // If the category is not found, it might have been deleted
      // similar to tags
      const deletedCategoryIndex = categories.indexOf(categoryId);
      categories.splice(deletedCategoryIndex, 1);
      return;
    }
  }

  const checkIfUtf8 = (file) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = function (e) {
        const text = e.target.result;
        // Try parsing the text as UTF-8, if there's an error, it's not UTF-8
        try {
          new TextDecoder("utf-8").decode(new TextEncoder().encode(text));
          resolve(true); // It is UTF-8
        } catch (e) {
          resolve(false); // It's not UTF-8
        }
      };

      reader.onerror = function () {
        reject("Error reading file");
      };

      reader.readAsText(file);
    });
  };

  const checkFileFormat = useCallback(async (file) => {
    const validFormats = {
      pdfA: ["application/pdf"],
      pdfE: ["application/pdf"],
      utf8: ["text/plain"],
      tiff: ["image/tiff"],
      jpeg: ["image/jpeg"],
      png: ["image/png"],
      jpeg2000: ["image/jp2", "image/j2k"],
      svg: ["image/svg+xml"],
    };

    const fileExtension = file.name.split(".").pop().toLowerCase();
    const fileType = file.type;

    // Check for PDF/A PDF/E
    if (fileExtension === "pdf" && validFormats.pdfA.includes(fileType)) {
      return { valid: true };
    }

    // Check for UTF-8 (plain text) - Check file encoding
    if (fileExtension === "txt" && validFormats.utf8.includes(fileType)) {
      const isUtf8 = await checkIfUtf8(file);
      if (isUtf8) {
        return { valid: true };
      } else {
        return { valid: false, message: "Fajl .txt nije tipa UTF-8." };
      }
    }

    // Check for other formats (image formats, etc.)
    if (fileExtension === "tiff" && validFormats.tiff.includes(fileType)) {
      return { valid: true };
    }

    if (
      (fileExtension === "jpeg" || fileExtension === "jpg") &&
      validFormats.jpeg.includes(fileType)
    ) {
      return { valid: true };
    }

    if (fileExtension === "png" && validFormats.png.includes(fileType)) {
      return { valid: true };
    }

    if (
      (fileExtension === "jp2" || fileExtension === "j2k") &&
      validFormats.jpeg2000.includes(fileType)
    ) {
      return { valid: true };
    }

    if (fileExtension === "svg" && validFormats.svg.includes(fileType)) {
      return { valid: true };
    }

    return {
      valid: false,
      message:
        "Format fajla nije podržan. Dozvoljeni formati su: .pdf, .txt, .tiff, .jpeg, .jpg, .png, .jp2, .j2k, .svg",
    };
  }, []);

  const handleFileInput = useCallback(
    async (event) => {
      const file = event.target.files[0];
      const formDataTemp = new FormData();
      setFileTypeError("");

      const fileTypeCheck = await checkFileFormat(file);
      if (!fileTypeCheck.valid) {
        setFileTypeError(fileTypeCheck.message);
        //return;
      }

      const fileNameTemp = file.name;
      setFileNameUpload(fileNameTemp);
      setIsFolder(false);
      if (!name) {
        setName(fileNameTemp.substring(0, fileNameTemp.lastIndexOf(".")));
      }
      formDataTemp.append("fileName", fileNameTemp);
      formDataTemp.append("files", file);

      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      //console.log("File size in MB:", fileSizeInMB);
      setFileSize(fileSizeInMB);

      setFormData(formDataTemp);
      //}
    },
    [name, checkFileFormat],
  );

  const handleFolderInput = useCallback(
    async (event) => {
      const files = event.target.files;
      const formDataTemp = new FormData();
      let totalSize = 0;
      const fileNamesSet = new Set(); // To track filenames

      //browser itself will detect 0 files inside, so this wont alert!
      if (files.length === 0) {
        alert(
          "The selected folder is empty. Please select a folder with files.",
        );
        return;
      }

      //i dont wont recursive subfolders, only files inside main folder
      for (let file of files) {
        const relativePath = file.webkitRelativePath || file.name;
        if (relativePath.split("/").length > 2) {
          alert(
            "Struktura sadržaja foldera nije dobra. Folder ne sme sadržati podfoldere!",
          );
          return;
        }

        // Check for duplicate filenames
        // windows does not allow duplicate filenames in the same folder
      if (fileNamesSet.has(file.name)) {
        alert(`Pronadjen fajl sa istim imenom: ${file.name}. Uklonite fajlove sa istim imenom iz foldera.`);
        return;
      }
      fileNamesSet.add(file.name); // Add filename to the set

        const fileTypeCheck = await checkFileFormat(file);
        if (!fileTypeCheck.valid) {
          setFileTypeError(fileTypeCheck.message);
          //return;
        }
        totalSize += file.size;
      
      formDataTemp.append("files", file);
      }

      const folderPath =
        files[0].webkitRelativePath || files[0].mozFullPath || files[0].name;
      const folderNameTemp = folderPath.split("/")[0];
      setFolderNameUpload(folderNameTemp);
      setIsFolder(true);
      formDataTemp.append("folderName", folderNameTemp);
      if (!name) {
        setName(folderNameTemp);
      }

      const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      setFileSize(totalSizeInMB);
      setFormData(formDataTemp);
    },
    [name, checkFileFormat],
  );

  async function downloadFile(ev) {
    ev.preventDefault();

    try {
      const response = await userRequest.get("document/file/download", {
        params: {
          id: _id,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
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
      const response = await userRequest.get("document/file/download", {
        params: {
          id: _id,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
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
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/zip" });
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

  /* //old logic for category[0] as single value
  useEffect(() => {
    const currentCategory = categoriesAll.find(
      (cat) => cat._id === category[0],
    );
    if (originDate && currentCategory) {
      if (
        (currentCategory.keepYears === 0 && currentCategory.keepMonths === 0) ||
        (currentCategory.keepMonths === null &&
          currentCategory.keepYears === null)
      ) {
        setKeepDate(null);
      } else {
        const keepYears = currentCategory.keepYears || 0;
        const keepMonths = currentCategory.keepMonths || 0;
        const newKeepDate = new Date(originDate);
        newKeepDate.setMonth(
          newKeepDate.getMonth() + keepYears * 12 + keepMonths,
        );
        setKeepDate(newKeepDate);
      }
    }
  }, [originDate, category, categoriesAll]);
  */

  useEffect(() => {
    if (originDate && categories.length > 0 && categoriesAll.length > 0) {
      const validCategories = categories
        .map((categoryId) => categoriesAll.find((cat) => cat._id === categoryId))
        .filter((cat) => cat); // Filter out invalid categories
  
      const maxKeepPeriodCategory = validCategories.reduce(
        (maxCategory, currentCategory) => {
          const currentKeepPeriod =
            (currentCategory.keepYears === 0 && currentCategory.keepMonths === 0)
              ? Infinity // Special case: infinity
              : (currentCategory.keepYears || 0) * 12 +
                (currentCategory.keepMonths || 0);
          const maxKeepPeriod =
            (maxCategory.keepYears === 0 && maxCategory.keepMonths === 0)
              ? Infinity // Special case: infinity
              : (maxCategory.keepYears || 0) * 12 +
                (maxCategory.keepMonths || 0);
          return currentKeepPeriod > maxKeepPeriod ? currentCategory : maxCategory;
        },
        { keepYears: -1, keepMonths: -1 }, // Initialize maxCategory with default values
      );
  
      if (maxKeepPeriodCategory) {
        if (
          maxKeepPeriodCategory.keepYears === 0 &&
          maxKeepPeriodCategory.keepMonths === 0
        ) {
          setKeepDate(null); // Infinity case: no expiration date
        } else {
          const keepYears = maxKeepPeriodCategory.keepYears || 0;
          const keepMonths = maxKeepPeriodCategory.keepMonths || 0;
          const newKeepDate = new Date(originDate);
          newKeepDate.setMonth(
            newKeepDate.getMonth() + keepYears * 12 + keepMonths,
          );
          setKeepDate(newKeepDate); // Set keep date based on the longest keep period
        }
      }
    } else if (originDate && categories.length === 0) {
      // If no categories are selected, keepDate reset to null
      setKeepDate(null);
    }
  }, [originDate, categories, categoriesAll]);

  return (
    <>
      <div className="w-full rounded-lg bg-white overflow-y-auto">
        <form onSubmit={saveDocument}>
          <div className="flex justify-center gap-8 mx-8 my-8">
            <div className="w-1/2">
              <div className="w-full">
                {!fileName && (
                  <div className="w-full border-b-2">
                    <div className="my-1 gap-2 flex">
                      <label className="button-basic-sky items-center flex justify-center">
                        <FiUpload className="flex text-2xl" />
                        <div className="text-center">Arhiviraj fajl</div>
                        <input
                          className="hidden"
                          spellCheck="false"
                          type="file"
                          onClick={(event) => {
                            event.target.value = null;
                          }}
                          onInput={handleFileInput}
                          disabled={existingIsDeleted}
                        />
                      </label>
                      <label className="button-basic-sky items-center flex justify-center">
                        <FiUpload className="flex text-2xl" />
                        <div className="text-center">Arhiviraj folder</div>
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
                          disabled={existingIsDeleted}
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
                        className="button-basic-sky items-center flex justify-center" 
                      >
                        <FiDownload className="text-2xl" />
                        {!isFolder ? "Preuzmi fajl" : "Preuzmi folder"}
                      </button>
                      {(fileExt === "pdf" || isFolder) && (
                        <button
                          onClick={
                            fileExt === "pdf" ? previewPdf : fetchFolderContents
                          }
                          className="button-basic-sky items-center flex justify-center"
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
                {/*
                <div className="py-1">
                  <label>Naziv fajla/foldera (*obavezno ako se arhivira fajl/folder)</label>
                  <input
                    className="input-field flex w-full"
                    type="text"
                    value={name}
                    placeholder="Naziv"
                    onChange={(ev) => {
                      setName(ev.target.value);
                    }}
                    disabled={existingIsDeleted}
                  />
                </div>
                */}
                <div className="py-1">
                  <label>Redni broj*</label>
                  <input
                    className="input-field flex w-1/3"
                    type="number"
                    value={serialNumber}
                    placeholder="Redni broj"
                    onChange={(ev) => {
                      setSerialNumber(ev.target.value);
                    }}
                    disabled={existingIsDeleted}
                  />
                </div>
                <div className="pb-1">
                  <label>Sadržaj* (naziv dokumentacije)</label>
                  <textarea
                    className="input-field flex h-16 w-full"
                    spellCheck="false"
                    placeholder="Sadržaj polje iz arhivske knjige"
                    value={content}
                    onChange={(ev) => setContent(ev.target.value)}
                    disabled={existingIsDeleted}
                  />
                </div>
                <div className="pb-1">
                  <label>Klasifikacija* (kategorija)</label>
                  <CategorySelect
                    className="flex w-full"
                    value=""
                    options={categoriesAll}
                    onChange={(ev) => addCategoryToDocument(ev.target.value)}
                    disabled={existingIsDeleted}
                  />
                  <div className="flex flex-wrap w-full">
                    {categoriesAll.length > 0 && categories.length > 0 &&
                      categories.map((categoryId) => (
                        <div key={categoryId} className="items-center flex mr-1 mt-1">
                          <button
                            type="button"
                            onClick={() => removeCategoryFromDocument(categoryId)}
                            className="button-default p-1 z-10"
                          >
                            <AiOutlineClose />
                          </button>
                          <button
                            className="button-edit p-0 pl-6 pr-2 -ml-5"
                            onClick={(ev) => {
                              ev.preventDefault();
                              window.open(
                                `/categories?categoryId=${categoryId}`,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            <p className="underline">{getCategoryNameById(categoryId)}</p>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="pb-1 flex w-full">
                  <div className="w-1/2">
                    <label className="block">Datum nastanka*</label>
                    <DatePicker
                      className="shadow border rounded p-2 w-28 border-default bg-default cursor-pointer"
                      selected={originDate}
                      onChange={(date) => {
                        if (date) {
                          // Ensure date is not null
                          setOriginDate(date);
                          setYearStart(date.getFullYear());
                        }
                      }}
                      dateFormat="dd/MM/yyyy"
                      isClearable={false} // Prevent clearing the field
                      required // Mark the field as required
                      disabled={existingIsDeleted}
                    />
                  </div>
                  <div className="w-1/2">
                    <label>Datum isteka (po kategoriji)</label>
                    <p className="shadow rounded p-2 w-28 border-default bg-gray-300">
                      {keepDate === 0
                        ? "trajno"
                        : keepDate && !isNaN(keepDate)
                          ? keepDate.toLocaleDateString("en-GB")
                          : "--"}
                    </p>
                  </div>
                </div>
                <div className="pb-1 flex w-full">
                  <div className="w-1/2">
                    <label>Godina nastanka*</label>
                    <input
                      className="input-field flex w-2/4"
                      type="number"
                      value={yearStart}
                      placeholder="Godina nastanka"
                      onChange={(ev) => {
                        setYearStart(ev.target.value);
                      }}
                      disabled={existingIsDeleted}
                    />
                  </div>
                  <div className="w-1/2">
                    <label>Godina raspona</label>
                    <input
                      className="input-field flex w-2/4"
                      type="number"
                      value={yearEnd}
                      placeholder="Godina raspona"
                      onChange={(ev) => {
                        setYearEnd(ev.target.value);
                      }}
                      disabled={existingIsDeleted}
                    />
                  </div>
                </div>
                <div>
                  <label>Napomena</label>
                  <textarea
                    className="input-field flex h-16 w-full"
                    spellCheck="false"
                    placeholder="primer: prostorija 2, polica 3"
                    value={note}
                    onChange={(ev) => setNote(ev.target.value)}
                    disabled={existingIsDeleted}
                  />
                </div>
              </div>
            </div>
            <div className="w-1/2">
              <div className="pb-1">
                <label>
                  Lokacija - prostorija i polica (
                  <span className="italic">
                    *popuniti ako ne arhivirate fajl
                  </span>
                  )
                </label>
                <textarea
                  className="input-field flex h-16 w-full"
                  spellCheck="false"
                  placeholder="primer: prostorija 2, polica 3"
                  value={physicalLocation}
                  onChange={(ev) => setPhysicalLocation(ev.target.value)}
                  disabled={existingIsDeleted}
                />
              </div>
              <div className="pb-1">
                <label>
                  Količina u jedinicama čuvanja (
                  <span className="italic">
                    *popuniti ako ne arhivirate fajl
                  </span>
                  )
                </label>
                <input
                  className="input-field flex w-full"
                  type="text"
                  value={quantity}
                  placeholder="primer: 2 registratora ili fascikli"
                  onChange={(ev) => {
                    setQuantity(ev.target.value);
                  }}
                  disabled={existingIsDeleted}
                />
              </div>
              <div className="w-full">
                <h1 className="text-default text-xl text-center italic font-semibold border-b-2">
                  Dodatna polja
                </h1>
                <div className="py-1">
                  <label>Komitent</label>
                  <select
                    className="input-field flex w-full"
                    value={client}
                    onChange={(ev) => setClient(ev.target.value)}
                    disabled={existingIsDeleted}
                  >
                    <option value="">Izaberi komitenta</option>
                    {clientsAll.length > 0 &&
                      clientsAll.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="pb-1">
                  <label>Tagovi</label>
                  <select
                    className="input-field flex w-full"
                    value=""
                    onChange={(ev) => addTagToDocument(ev.target.value)}
                    disabled={existingIsDeleted}
                  >
                    <option value="">Izaberi tag</option>
                    {tagsAll.length > 0 &&
                      tagsAll.map((tag, k) => (
                        <option key={tag._id} value={k}>
                          {tag.name}
                        </option>
                      ))}
                  </select>
                  <div className="flex flex-wrap w-full">
                    {tagsAll.length > 0 &&
                      tags.length > 0 &&
                      tags.map((tag) => (
                        <div key={tag} className="items-center flex mr-1 mt-1">
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
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            <p className="underline">{getTagNameById(tag)}</p>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <label>Opis</label>
                  <textarea
                    className="input-field flex h-16 w-full"
                    spellCheck="false"
                    placeholder="Opis dokumenta za dodatnu pretragu"
                    value={description}
                    onChange={(ev) => setDescription(ev.target.value)}
                    disabled={existingIsDeleted}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center py-4 gap-8">
            { !existingIsDeleted && (
            <button type="submit" className="button-basic px-8" disabled={existingIsDeleted}>
              {_id ? "Izmeni" : "Sačuvaj"}
            </button>
            )}
            <Link to={!existingIsDeleted ? "/document" : "/recyclebin"}>
              <button className="button-default px-8" type="button">
                Otkaži
              </button>
            </Link>
            {_id && !existingIsDeleted && (
              <button
                type="button"
                onClick={() => {
                  setModalOnRecycle(true);
                }}
                className="button-delete text-white px-8"
              >
                Obriši
              </button>
            )}
            {_id && existingIsDeleted && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setModalOnRestore(true);
                  }}
                  className="button-basic-alternative px-8"
                >
                  Obnovi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOnDelete(true);
                  }}
                  className="button-delete text-white px-8"
                >
                  Obriši trajno
                </button>
              </>
            )}
          </div>
          <ErrorMessages errors={errors} />
        </form>
      </div>
      <ModalFolderContent
        show={showModalFolderContent}
        handleClose={() => setShowModalFolderContent(false)}
        files={files}
        folderId={_id}
      />
      {modalOnRecycle && (
        <DeleteModal
          setModalOn={setModalOnRecycle}
          setChoice={setChoiceModalRecycle}
          modalMessage={`Da li želite obrisati dokument sa sadržajem: ${content}?`}
        />
      )}
      {modalOnRestore && (
        <DeleteModal
          setModalOn={setModalOnRestore}
          setChoice={setChoiceModalRestore}
          modalMessage={`Da li želite vratiti dokument sa sadržajem: ${content}?`}
          color="green"
        />
      )}
      {modalOnDelete && (
        <DeleteModal
          setModalOn={setModalOnDelete}
          setChoice={setChoiceModalDelete}
          modalMessage={`Da li želite obrisati dokument sa sadržajem: ${content}?`}
        />
      )}
    </>
  );
};

export default DocumentForm;
