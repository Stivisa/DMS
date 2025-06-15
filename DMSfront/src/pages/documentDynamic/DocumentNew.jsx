import React, { useState, useEffect } from "react";
import DocumentForm from "./DocumentForm";
import { userRequest } from "../../utils/requestMethods";
import { handleRequestErrorAlert } from "../../utils/errorHandlers";

const DocumentNew = () => {
  const [latestSerialNumber, setLatestSerialNumber] = useState(null);

  useEffect(() => {
    const getLatestSerialNumber = async () => {
      try {
        const response = await userRequest.get("document/serial-number/latest");
        const latestSerialNumber = response.data.latestSerialNumber + 1;
        setLatestSerialNumber(latestSerialNumber);
      } catch (err) {
        handleRequestErrorAlert(err);
        alert(err.response?.data?.error);
      }
    };
    getLatestSerialNumber();
  }, []);

  return (
    <div>
      {latestSerialNumber && <DocumentForm serialNumber={latestSerialNumber} />}
    </div>
  );
};

export default DocumentNew;
