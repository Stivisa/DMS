import { React, useState } from "react";
import {loginSuccess } from "../redux/userRedux";
import { publicRequest,setAlertShown } from "../utils/requestMethods";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import { resetCompany } from "../redux/companyRedux";
import { handleRequestErrorAlert } from "../utils/errorHandlers";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.preventDefault();
    setErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
      try {
        const res = await publicRequest
          .post("/auth/login", { username, password });
        dispatch(loginSuccess(res.data));

        setAlertShown(false);

        dispatch(resetCompany());
        navigate("/companiesmenu");
      } catch (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error});
      }
  };

  const validateForm = () => {
    const errors = {};
    if (!username) errors.username = "Korisničko ime je obavezno!";
    if (!password) errors.password = "Šifra je obavezna!";
    return errors;
  };

  return (
    <div className="grid grid-cols-1  h-screen w-full">
      <div className="bg-white flex flex-col justify-center items-center">
        <form className="max-w-[400px] w-full mx-auto bg-white p-4 rounded">
          <h2 className="text-3xl font-bold text-center py-6">ARHIVA DOKUMENATA</h2>
          <div className="flex flex-col py-2">
            <p>Korisničko ime</p>
            <input
              className="inputAuth"
              type="text"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col py-2">
            <p>Šifra</p>
            <div className="flex items-center w-full relative">
              <input
                className="inputAuth pr-10"
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
          </div>
          <button
            onClick={handleClick}
            className="button-basic w-full mt-5 py-2 text-xl font-semibold rounded-md" 
          >
            Prijavi se
          </button>
        </form>
        <div className="h-24 max-w-[400px] items-center justify-center">
        {Object.keys(errors).length > 0 && (
            <div className="text-rose-600 ml-1">
              {Object.keys(errors).map((key) => (
                <p key={key}>{errors[key]}</p>
              ))}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full text-center py-4 bg-gray-300 font-bold text-xl">
          BARISTA NOVA
        </div>
      </div>
    </div>
  );
}
