import React, { useEffect, useState } from "react";
import DocumentForm from "./DocumentForm";
import { useParams } from "react-router-dom";
import { userRequest } from "../../utils/requestMethods";
import { handleRequestErrorAlert } from "../../utils/errorHandlers";

const DocumentEdit = () => {
  const [document, setDocument] = useState(null);
  const params = useParams();
  const { id } = params;
  const [errors] = useState({});

  useEffect(() => {
    if (!id) {
      return;
    }
    userRequest
      .get("document/" + id)
      .then((response) => {
        setDocument(response.data);
      })
      .catch(function (err) {
        handleRequestErrorAlert(err);
        alert(err.response?.data?.error);
      });
  }, [id]);
  return <div>{document && <DocumentForm {...document} errors={errors}/>}</div>;
};

export default DocumentEdit;
