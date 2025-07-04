import axios from "axios";
import { store } from "../redux/store";
import { resetCompany } from "../redux/companyRedux";
import { logout } from "../redux/userRedux";

export const BASE_URL = process.env.REACT_APP_SERVER_URL;

let isAlertShown = false;

export const setAlertShown = (value) => {
  isAlertShown = value;
};

export const publicRequest = axios.create({
  baseURL: BASE_URL,
});

export const userRequest = axios.create({
  baseURL: BASE_URL,
});

userRequest.interceptors.request.use(
  (config) => {
    const { user, company } = store.getState();
    const token = user?.currentUser?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (company) {
      config.headers.companyfolder = company?.currentCompany?.folderName;
      config.headers.companyid = company?.currentCompany?._id;
      config.headers.companyname = company?.currentCompany?.name;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

userRequest.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response.status === 511 &&
      error.response?.data === "Prijava je istekla!" &&
      !isAlertShown
    ) {
      isAlertShown = true;
      alert("Prijava je istekla!");
      store.dispatch(logout()); // Dispatch the logout action
      store.dispatch(resetCompany()); // Dispatch the resetCompany action
      window.location.href = "/login"; // Redirect to login page
    }
    return Promise.reject(error);
  },
);
