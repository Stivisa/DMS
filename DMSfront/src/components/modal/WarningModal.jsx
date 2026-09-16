import React from "react";
import { MdWarning } from "react-icons/md";

const WarningModal = ({ onClose, message }) => {
  return (
    <div
      onClick={onClose}
      className="fixed w-full h-screen z-50 top-0 left-0 bg-black bg-opacity-50"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="w-96 rounded-2xl shadow bg-gray-50 border-4 border-rose-600 fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 p-6"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <MdWarning size={32} className="text-error" />
          <h2 className="text-lg font-bold text-error">UPOZORENJE</h2>
        </div>

        <p className="text-center text-gray-800 mb-6">{message}</p>

        <div className="flex justify-center">
          <button className="button-basic" onClick={onClose}>
            U redu
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;
