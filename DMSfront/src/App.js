import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Users from "./pages/Users";
import Clients from "./pages/Clients";
import Login from "./pages/Login";
import Tags from "./pages/Tags";
import PrivateRoutes from "./utils/PrivateRoutes";
import Categories from "./pages/Categories";
import RecycleBin from "./pages/documentDynamic/RecycleBin";
import Password from "./pages/Password";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import { useSelector } from "react-redux";
import CompaniesMenu from "./pages/CompaniesMenu";
import DocumentDynamic from "./pages/documentDynamic/Document";
import DocumentDynamicNew from "./pages/documentDynamic/DocumentNew";
import DocumentDynamicEdit from "./pages/documentDynamic/DocumentEdit";
import { useDispatch } from "react-redux";
import { logout } from "./redux/userRedux";

function App() {
  const user = useSelector((state) => state.user.currentUser);
  const isAdmin = user && user.isAdmin;
  const superAdmin = user && user.superAdmin;

  const dispatch = useDispatch();
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "persist:root") {
        const persistedState = JSON.parse(event?.newValue);
        const userObject = JSON.parse(persistedState?.user);
        const currentUser = userObject?.currentUser;
        if (currentUser === null) {
          console.log("LOGOUT");
          dispatch(logout());
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="bg-default h-screen">
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route element={<DocumentDynamic />} path="/" />
            <Route element={<Clients />} path="/clients" />
            {isAdmin && <Route element={<Users />} path="/users" />}
            <Route element={<Tags />} path="/tags" />
            <Route element={<Tags />} path="/tags/:id" />
            <Route element={<Categories />} path="/categories" />

            {/*
            <Route element={<Documents />} path="/documents" />
            <Route element={<DocumentNew />} path="/documents/new" />
            <Route element={<DocumentEdit />} path="/documents/edit/:id" /> 
            */}

            <Route element={<DocumentDynamic />} path="/document" />
            <Route element={<DocumentDynamicNew />} path="/document/new" />
            <Route
              element={<DocumentDynamicEdit />}
              path="/document/edit/:id"
            />

            <Route element={<RecycleBin />} path="/recyclebin" />

            <Route element={<Password />} path="/password" />
            {superAdmin && <Route element={<Settings />} path="/settings" />}
            <Route element={<Help />} path="/help" />
            <Route element={<CompaniesMenu />} path="/companiesmenu" />
          </Route>
          <Route element={<Login />} path="/login" />
          {/*<Route element={<Register />} path="/register" />*/}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
