import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { IoPerson } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/userRedux";
import { resetCompany } from "../redux/companyRedux";
import { userRequest } from "../utils/requestMethods";
import { handleRequestErrorAlert } from "../utils/errorHandlers";
import { TbLogout } from "react-icons/tb";
import { RiLockPasswordLine } from "react-icons/ri";
import { BsBuildingGear } from "react-icons/bs";

const NavbarNew = ({ onResetActiveLink }) => {
  const [dropdown, setDropdown] = useState(false);
  const user = useSelector((state) => state.user.currentUser);
  const companyName = useSelector(
    (state) => state.company?.currentCompany?.name,
  );
  const companyOnlyOne = useSelector((state) => state.company?.onlyOne);
  const dispatch = useDispatch();
  const [diskFree, setDiskFree] = useState("");
  const [diskSize, setDiskSize] = useState("");
  const [diskError, setDiskError] = useState("");

  function Logout() {
    dispatch(logout());
    dispatch(resetCompany());
  }

  const getStorageFreeSpace = useCallback(async () => {
    try {
      setDiskError("");
      const response = await userRequest.get("settings/storage/free");
      setDiskFree(response.data.gbFree);
      setDiskSize(response.data.gbSize);
    } catch (err) {
      const errorCode = err.response?.data?.code;
      if (errorCode === "DISK_PATH_NOT_FOUND") {
        setDiskError(err.response?.data?.error);
      } else {
        handleRequestErrorAlert(err);
        setDiskError(err.response?.data?.error);
      }
    }
  }, []);

  useEffect(() => {
    getStorageFreeSpace();
  }, [getStorageFreeSpace]);

  return (
    <div className="bg-white w-full border shadow h-16 px-4 flex justify-between items-center ">
      {/* Left side */}
      <div className="flex items-center">
        {companyOnlyOne ? (
          <h1 className="text-4xl text-default hover-default rounded-full p-2">
            {companyName ? companyName : "NISTE IZABRALI FIRMU"}
          </h1>
        ) : (
          <Link to="/companiesmenu" onClick={onResetActiveLink}>
            <h1 className="text-4xl text-default hover-default rounded-full p-2">
              {companyName ? companyName : "NISTE IZABRALI FIRMU"}
            </h1>
          </Link>
        )}
      </div>
      <div>
        <div className="flex items-center">
          {/*disk space*/}
          {diskFree > 0 && diskSize > 0 && (
            <div
              className="mr-2 min-w-28 flex flex-col items-center justify-center"
              title="Preostalo prostora"
            >
              <div className="text-xl w-full items-center justify-center font-bold ">
                {diskFree}GB
              </div>
              <div className="h-2 w-full rounded-md bg-gray-300">
                <div
                  style={{ width: `${100 - (diskFree / diskSize) * 100}%` }}
                  className={`h-full rounded-md ${
                    (diskFree / diskSize) * 100 < 20
                      ? "bg-rose-600"
                      : "bg-basic"
                  }`}
                ></div>
              </div>
            </div>
          )}
          {diskError && (
            <div className="text-error mr-2 min-w-28 flex flex-col items-center justify-center">
              {diskError}
            </div>
          )}

          <button
            className="button-basic-alternative flex items-center"
            onClick={() => setDropdown(!dropdown)}
          >
            <IoPerson size={20} className="mr-1" />
            <span className="hidden sm:flex font-semibold">
              {user?.username}
            </span>
          </button>
          {dropdown && (
            <div
              onClick={() => setDropdown(!dropdown)}
              className=" fixed w-full h-screen z-10 top-0 left-0"
            ></div>
          )}
        </div>
        {dropdown && (
          <div className="z-10 absolute right-0 mt-2 mr-2 py-1 w-40 bg-default rounded-lg  shadow-md text-basic">
            {!companyOnlyOne && (
              <Link
                to="/companiesmenu"
                onClick={() => {
                  onResetActiveLink();
                  setDropdown(!dropdown);
                }}
              >
                <div className="flex items-center  px-4 py-2 hover-basic-alternative rounded-full">
                  <BsBuildingGear size={20} className="text-basic mr-1" />
                  <span>Izaberi firmu</span>
                </div>
              </Link>
            )}
            <Link to="/password" onClick={() => setDropdown(!dropdown)}>
              <div className="flex items-center  px-4 py-2 hover-basic-alternative rounded-full">
                <RiLockPasswordLine size={20} className="text-basic mr-1" />
                <span>Promeni šifru</span>
              </div>
            </Link>
            <Link to="/login" onClick={Logout}>
              <div className="flex items-center  px-4 py-2 hover-basic-alternative rounded-full">
                <TbLogout size={20} className="text-basic mr-1" />
                <span>Odjavi se</span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavbarNew;
