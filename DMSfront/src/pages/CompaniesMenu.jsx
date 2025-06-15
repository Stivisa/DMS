import React, { useEffect, useCallback, useState } from "react";
import { setCompany, setOnlyOne } from "../redux/companyRedux";
import { userRequest } from "../utils/requestMethods";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const CompaniesMenu = () => {
  const companyName = useSelector(
    (state) => state.company?.currentCompany?.name,
  );
  const dispatch = useDispatch();
  const [companies, setCompanies] = useState([]);

  const navigate = useNavigate();

  const getCompanies = useCallback(async () => {
    try {
      const response = await userRequest.get("/companies");
      const companies = response.data;
      setCompanies(companies);
      if (companies.length === 1) {
        dispatch(setCompany(companies[0]));
        navigate("/");
      } else if (companies.length > 1) {
        dispatch(setOnlyOne(false));
        dispatch(setCompany(companies[0]));
      }
    } catch (error) {
      handleRequestErrorAlert(error);
    }
  }, [navigate, dispatch]);

  useEffect(() => {
    document.title = "FIRME";
    getCompanies();
  }, [getCompanies]);

  return (
    <div className="flex justify-center items-center ">
      <div className="w-1/3 p-1 border rounded-lg bg-white">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl p-2 font-bold text-default">IZABERITE FIRMU</h1>
        </div>
        <ul className="max-h-[calc(100vh-130px)] overflow-y-auto">
          {companies.map((company, index) => (
            <li key={index} className="p-1 cursor-pointer">
              <div
                className={
                  company.name === companyName
                    ? "button-basic text-xl font-semibold  flex items-center justify-center text-center"
                    : "button-default text-xl font-semibold flex items-center justify-center text-center"
                }
                onClick={() => {
                  dispatch(setCompany(company));
                }}
              >
                {company.name}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CompaniesMenu;
