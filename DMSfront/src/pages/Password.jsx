import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userRequest } from "../utils/requestMethods";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import { PiEye, PiEyeSlash } from "react-icons/pi";
import ErrorMessages from "../components/ErrorMessages";

export default function Password() {
  const [oldpassword, setOldPassword] = useState("");
  const [newpassword, setNewPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!oldpassword) errors.oldpassword = "Stara šifra je obavezna!";
    if (!newpassword) errors.newpassword = "Nova šifra je obavezna!";
    if (!confirmpassword)
      errors.newpasswordconfirm = "Potvrda nove šifre je obavezna!";
    return errors;
  };

  const handleClick = async (e) => {
    e.preventDefault();
    setErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    if (newpassword !== confirmpassword) {
      setErrors({ message: "Nova i potvrda nove šifre nisu iste!" });
      return;
    }
    if (newpassword === oldpassword) {
      setErrors({ message: "Nova i stara šifra su iste!" });
      return;
    }

    await userRequest
      .put("users/changepassword", {
        oldpassword,
        newpassword,
      })
      .then((response) => {
        navigate("/");
      })
      .catch(function (err) {
        handleRequestErrorAlert(err);
        setErrors({ message: err.response?.data?.error });
      });
  };

  return (
    <div className="grid grid-cols-1 h-[calc(100vh-75px)]  w-full">
      <div className="bg-white flex flex-col justify-center items-center">
        <form className="max-w-[400px] w-full mx-auto bg-white p-4 rounded">
          <h2 className="text-3xl font-bold text-center py-6">NAZIV FIRME</h2>
          <div className="flex flex-col py-2">
            <p>Stara šifra</p>
            <div className="flex items-center w-full relative">
              <input
                className="inputAuth pr-10"
                type={showOldPassword ? "text" : "password"}
                onChange={(e) => setOldPassword(e.target.value)}
              />

              <button
                type="button"
                className="absolute right-0 p-3 m-0"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? (
                  <PiEye className="h-5 w-5 text-gray-500" />
                ) : (
                  <PiEyeSlash className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col py-2">
            <p>Nova šifra</p>
            <div className="flex items-center w-full relative">
              <input
                className="inputAuth pr-10"
                type={showNewPassword ? "text" : "password"}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <button
                type="button"
                className="absolute right-0 p-3 m-0"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <PiEye className="h-5 w-5 text-gray-500" />
                ) : (
                  <PiEyeSlash className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col py-2">
            <p>Potvrdite novu šifru</p>
            <div className="flex items-center w-full relative">
              <input
                className="inputAuth pr-10"
                type={showConfirmPassword ? "text" : "password"}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                className="absolute right-0 p-3 m-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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
            Promeni šifru
          </button>
        </form>
        <div className="h-24 max-w-[400px] items-center justify-center">
          <ErrorMessages errors={errors} />
        </div>
      </div>
    </div>
  );
}
