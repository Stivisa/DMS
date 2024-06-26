import React, { useEffect, useState, useCallback} from "react";
import { Link } from "react-router-dom";
import {
  AiOutlineMenu,
  AiOutlineClose,
  AiFillTags,
  AiFillSetting,
} from "react-icons/ai";
import { BsFillPersonFill, BsFillHousesFill } from "react-icons/bs";
import { BiSolidCategory } from "react-icons/bi";
import { IoDocumentsSharp } from "react-icons/io5";
import { MdDelete, MdHelp } from "react-icons/md";
import { IoIosPeople } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/userRedux";
import { resetCompany } from "../redux/companyRedux";
import { userRequest } from "../utils/requestMethods";
import { handleRequestErrorAlert } from "../utils/errorHandlers";

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const user = useSelector((state) => state.user.currentUser);
  const companyName = useSelector((state) => state.company?.currentCompany?.name);
  const dispatch = useDispatch();
  const [diskFree, setDiskFree] = useState("");
  const [diskSize, setDiskSize] = useState("");

  const isAdmin = user && user.isAdmin;
  const superAdmin = user.superAdmin;

  function Logout() {
    dispatch(logout());
    dispatch(resetCompany());
  }

  const getStorageFreeSpace = useCallback(
    async () => {
      try {
        const response = await userRequest.get("documents/storage/free");
        setDiskFree(response.data.gbFree);
        setDiskSize(response.data.gbSize);
      } catch (error) {
        handleRequestErrorAlert(error);
      }
    },
    []
  );

  useEffect(() => {
    getStorageFreeSpace();
  }, [getStorageFreeSpace]);

  return (
    <div className=" w-full flex justify-between items-center p-4">
      {/* Left side */}
      <div className="flex items-center">
        <div onClick={() => setNav(!nav)} className="cursor-pointer">
          <AiOutlineMenu size={30} />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl px-2">
           <span >{companyName}</span>
        </h1>
        <div className="hidden lg:flex items-center bg-gray-200 rounded-full p-1 text-[14px]">
          <p className="bg-black text-white rounded-full p-2">Logo</p>
          <p className="p-2">Firme</p>
        </div>
      </div>
      <div>
        <div className="flex items-center z-10">
          {/*disk space*/}
          {diskFree > 0 && diskSize > 0 && (
            <div
              className="mr-2 min-w-28 flex flex-col items-center justify-center"
              title="Preostalo prostora"
            >
              <div className="text-xl w-full items-center justify-center font-bold ">
                {diskFree}GB
              </div>
              <div className="h-2 w-full rounded-md bg-gray-500">
                <div
                  style={{ width: `${(diskFree / diskSize) * 100}%` }}
                  className={`h-full rounded-md ${
                    22 < 20 ? "bg-red-600" : "bg-green-600"
                  }`}
                ></div>
              </div>
            </div>
          )}
          {diskFree === 0 && diskSize === 0 && (
            <div
              className="text-red-500 mr-2 min-w-28 flex flex-col items-center justify-center"
              title="Preostalo prostora"
            >
              Nije podešen disk za čuvanje podataka!
            </div>
          )}

          <button
            className="bg-black text-white sm:flex items-center py-2 rounded-full focus:border-white"
            onClick={() => setDropdown(!dropdown)}
          >
            <BsFillPersonFill size={20} className="mr-1" />
            <span className="hidden sm:flex">{user?.username}</span>
          </button>
          {dropdown && (
            <div
              onClick={() => setDropdown(!dropdown)}
              className=" fixed w-full h-screen z-10 top-0 left-0"
            ></div>
          )}
        </div>
        {dropdown && (
          <div className="z-10 absolute right-0 mt-2 mr-2 w-48 bg-gray-300 rounded-lg py-2 shadow-md">
            <Link to="/password">
              <p
                className="block px-4 py-2 hover:bg-gray-200"
                onClick={() => setDropdown(!dropdown)}
              >
                Promeni šifru
              </p>
            </Link>
            <Link to="/login" onClick={Logout}>
              <p className="block px-4 py-2 hover:bg-gray-200"> Odjavi se</p>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {/* Overlay */}
      {nav ? (
        <div
          onClick={() => setNav(!nav)}
          className="bg-black/80 fixed w-full h-screen z-10 top-0 left-0"
        ></div>
      ) : (
        ""
      )}

      {/* Side drawer menu */}
      <div
        className={
          nav
            ? "fixed top-0 left-0 w-[300px] h-screen bg-white z-10 duration-300"
            : "fixed top-0 left-[-100%] w-[300px] h-screen bg-white z-10 duration-300"
        }
      >
        <div className="bg-gray-400 m-0 items-center">
        <AiOutlineClose
          onClick={() => setNav(!nav)}
          size={30}
          className="absolute right-2 top-2 cursor-pointer"
        />
        <Link to="/" onClick={() => setNav(!nav)}>
          <h2 className="text-2xl p-2 font-bold">
            {companyName}
          </h2>
        </Link>
        </div>
        
        <nav className="overflow-y-auto">
          <ul className="flex flex-col p-4 text-gray-800">
            <Link to="/documents" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <IoDocumentsSharp size={25} className="mr-4" /> Dokumenti
              </li>
            </Link>
            <Link to="/categories" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <BiSolidCategory size={25} className="mr-4" /> Kategorije
              </li>
            </Link>
            <Link to="/tags" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <AiFillTags size={25} className="mr-4" /> Tagovi
              </li>
            </Link>
            <Link to="/clients" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <BsFillHousesFill size={25} className="mr-4" /> Komitenti
              </li>
            </Link>
            {isAdmin &&
            <Link to="/users" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <IoIosPeople size={25} className="mr-4" /> Korisnici
              </li>
            </Link>
            }
            <Link to="/recyclebin" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <MdDelete size={25} className="mr-4" /> Obrisani dokumenti
              </li>
            </Link>
            {superAdmin &&
            <Link to="/settings" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <AiFillSetting size={25} className="mr-4" /> Podešavanja
              </li>
            </Link>
            }
            <Link to="/help" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <MdHelp size={25} className="mr-4" /> Pomoć
              </li>
            </Link>
            <Link to="/document" onClick={() => setNav(!nav)}>
              <li className="text-xl py-4 flex hover:bg-gray-100">
                <IoDocumentsSharp size={25} className="mr-4" /> Dokumenti test
              </li>
            </Link>
          </ul>
        </nav>
        <div className="bg-gray-200 absolute inset-x-0 bottom-0 h-12">
          <h1 className="text-4xl px-2 font-bold">BARISTA NOVA</h1>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
