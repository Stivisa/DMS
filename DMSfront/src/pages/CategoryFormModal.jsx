import React, { useEffect, useState, useCallback } from "react";
import ErrorMessages from "../components/ErrorMessages";
import { userRequest } from "../utils/requestMethods";
import { handleRequestErrorAlert } from "../utils/errorHandlers";

const CategoryFormModal = ({
  isOpen,
  onClose,
  getCategories,
  category,
}) => {
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState(0);
  const [label, setLabel] = useState("");
  const [keepYears, setKeepYears] = useState(0);
  const [keepMonths, setKeepMonths] = useState(0);
  const [errors, setErrors] = useState({});

  const getLatestSerialNumber = useCallback(async () => {
    try {
      const response = await userRequest.get("categories/serial-number/latest");
      const latestSerialNumber = response.data.latestSerialNumber + 1;
      setSerialNumber(latestSerialNumber);
    } catch (err) {
      handleRequestErrorAlert(err);
      alert(err.response?.data?.error);
    }
  }, []);

  useEffect(() => {
    if (isOpen){
    if (category) {
      setName(category.name || "");
      setSerialNumber(category.serialNumber);
      setLabel(category.label || "");
      setKeepYears(category.keepYears || 0);
      setKeepMonths(category.keepMonths || 0);
    } else {
      resetForm();
      getLatestSerialNumber(); // Fetch the latest serial number for new categories
    }
  }
  }, [category, getLatestSerialNumber, isOpen]);

  const resetForm = () => {
    setName("");
    setSerialNumber(0);
    setLabel("");
    setKeepYears(0);
    setKeepMonths(0);
    setErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Naziv kategorije je obavezan!";
    if (!serialNumber || isNaN(serialNumber) || parseInt(serialNumber, 10) <= 0) {
      errors.serialNumber = "Redni broj je obavezan i mora biti veći od 0!";
    }
    if (keepYears < 0 || keepMonths < 0) {
      errors.keepPeriodNegative = "Godine i meseci ne mogu biti negativni!";
    }
    if (keepMonths > 12) {
      errors.keepPeriodMonths = "Meseci moraju biti između 1 i 12!";
    }
    return errors;
  };

  const handleSaveCategory = async () => {
    try {
      if (category) {
        // Editing
        await userRequest.put(`categories/${category._id}`, {
          name,
          serialNumber,
          label,
          keepYears,
          keepMonths,
        });
      } else {
        // Creating
        await userRequest.post("categories", {
          name,
          serialNumber,
          label,
          keepYears,
          keepMonths,
        });
      }
      getCategories(); // Refresh the categories list
      onClose(); // Close the modal
    } catch (err) {
      handleRequestErrorAlert(err);
      setErrors({ message: err.response?.data?.error });
    }
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    handleSaveCategory();
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed w-full h-screen z-10 top-0 left-0 bg-black bg-opacity-50">
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className=" p-4 w-1/2 max-h-screen justify-center rounded-3xl shadow bg-white fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
      >
        <div><h2 className="text-xl text-center font-bold mb-4">
          {category ? "Izmeni Kategoriju" : "Kreiraj Kategoriju"}
        </h2></div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label>Redni broj*:</label>
            <input
              className="input-field w-full"
              type="number"
              value={serialNumber}
              placeholder="Redni broj"
              onChange={(ev) => setSerialNumber(ev.target.value)}
            />
          </div>
          <div className="mb-2">
            <label>Oznaka:</label>
            <input
              className="input-field w-full"
              type="text"
              value={label}
              placeholder="Oznaka"
              onChange={(ev) => setLabel(ev.target.value)}
            />
          </div>
          <div className="mb-2">
            <label>Naziv*:</label>
            <textarea
              className="input-field w-full"
              spellCheck="false"
              value={name}
              placeholder="Naziv kategorije"
              onChange={(ev) => setName(ev.target.value)}
            />
          </div>
          <div className="mb-2 flex items-center">
            <label>Rok čuvanja (podrazumevano trajno):</label>
            <input
              className="input-field w-1/4 ml-2"
              type="number"
              value={keepYears === 0 ? "" : keepYears}
              placeholder="Godine"
              onChange={(ev) => setKeepYears(ev.target.value)}
            />
            <label className="ml-2">god.</label>
            <input
              className="input-field w-1/4 ml-2"
              type="number"
              value={keepMonths === 0 ? "" : keepMonths}
              placeholder="Meseci"
              onChange={(ev) => setKeepMonths(ev.target.value)}
            />
            <label className="ml-2">mes.</label>
          </div>
          <ErrorMessages errors={errors} />
          <div className="flex justify-center mt-4">
            <button
              type="button"
              className="button-default mr-2"
              onClick={onClose}
            >
              Otkaži
            </button>
            <button type="submit" className="button-basic">
              Sačuvaj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;