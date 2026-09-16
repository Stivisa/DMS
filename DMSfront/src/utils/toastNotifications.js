import { toast } from "react-toastify";

/**
 * Centralized toast notification utility
 * Default config: 2.5s duration, bottom-right position, auto-close enabled
 * Color: Emerald (#10b981) - matches app primary color
 */

export const notifySuccess = (message) => {
  toast.success(message, {
    position: "bottom-right",
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progressStyle: {
      background: "#10b981",
    },
  });
};

export const notifyCreated = (entityName) => {
  notifySuccess(`${entityName} uspešno  kreiran!`);
};

export const notifyUpdated = (entityName) => {
  notifySuccess(`${entityName} uspešno  ažuriran!`);
};

export const notifyDeleted = (entityName) => {
  notifySuccess(`${entityName} uspešno  obrisan!`);
};

export const notifyInfo = (message) => {
  toast.info(message, {
    position: "bottom-right",
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progressStyle: {
      background: "#10b981",
    },
  });
};

export const notifyWarning = (message) => {
  toast.warning(message, {
    position: "bottom-right",
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progressStyle: {
      background: "#10b981",
    },
  });
};
