import React, { useEffect, useState } from "react";
import DocumentForm from "./DocumentForm";
import { useParams } from "react-router-dom";
import { userRequest } from "../../utils/requestMethods";
import { handleRequestErrorAlert } from "../../utils/errorHandlers";

const DocumentEdit = () => {
  const [document, setDocument] = useState(null);
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (!id) {
      return;
    }
    userRequest
      .get("documents/" + id)
      .then((response) => {
        setDocument(response.data);
      })
      .catch(function (error) {
        handleRequestErrorAlert(error);
      });
  }, [id]);
  return <div>{document && <DocumentForm {...document} />}</div>;
};

export default DocumentEdit;
