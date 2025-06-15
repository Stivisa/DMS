import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
//import Navbar from "../components/Navbar";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import React, { useState } from "react";

const PrivateRoutes = () => {
  const user = useSelector((state) => state.user.currentUser);

  //ova logika bila u Sidebar, medjutim i u Navbar imam link ka izboru firmi, pa je neka strana u  sidebaru ostajala aktivno obelezena iako nije posecena
  const [activeLink, setActiveLink] = useState(null);
  const handleResetActiveLink = () => {
    setActiveLink(null);
  };

  return user ? (
    <>
      <div>
        <Navbar onResetActiveLink={handleResetActiveLink} />
      </div>
      <div className="flex">
        <Sidebar activeLink={activeLink} setActiveLink={setActiveLink} />
        <div className="w-full mx-1 my-1">
          <Outlet />
        </div>
      </div>
    </>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoutes;

/*
   const PrivateRoutes = () => {
  const user = useSelector((state) => state.user.currentUser);
  return user ? (
     <>
      <Navbar />
      <Outlet />
    </>
  ) : (
    <Navigate to="/login" />
  );
};
*/
