import React from "react";

const Modal = ({ setModalOn, setChoice, modalMessage, color }) => {
  const handleOKClick = () => {
    setChoice(true);
    setModalOn(false);
  };
  const handleCancelClick = () => {
    setChoice(false);
    setModalOn(false);
  };

  return (
    //overlay
    <div
      onClick={handleCancelClick}
      className="fixed w-full h-screen z-10 top-0 left-0 bg-black bg-opacity-50"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="w-1/2 max-h-screen justify-center rounded-3xl shadow bg-gray-50 border-4 border-default flex fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
      >
        <div className="p-2">
          <h1 className="text-2xl text-gray-800 text-center py-2">
            {modalMessage}
          </h1>
          <div className="flex justify-center py-2 gap-4">
            <button
              className={
                color === "green"
                  ? "button-basic w-36 m-1 p-4"
                  : "button-delete bg-rose-500 hover:bg-rose-700 text-white w-36 m-1 p-4"
              }
              onClick={handleOKClick}
            >
              <span className="font-bold">DA</span>
            </button>
            <button
              className="button-default w-36 m-1 p-4"
              onClick={handleCancelClick}
            >
              <span className="font-bold">NE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
