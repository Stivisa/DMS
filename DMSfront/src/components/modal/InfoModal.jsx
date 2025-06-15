import React from "react";
import { RiCloseCircleFill } from "react-icons/ri";

const InfoModal = ({ onClose, sections }) => {
  return (
    <div
      onClick={onClose}
      className="fixed w-full h-screen z-10 top-0 left-0 bg-black bg-opacity-50"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="w-1/2 max-h-screen justify-center rounded-3xl shadow bg-gray-50 border-4 border-default flex fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
      >
        <div className="p-2">
          <h1 className="text-2xl text-default text-center py-2">POMOĆ</h1>
          <div className="flex flex-col items-center overflow-y-auto px-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className="flex items-center text-center mt-1 text-default px-4"
              >
                {section.icon && (
                  <>
                    <p className={`button-${section.buttonClass} mr-1`}>
                      {section.icon}
                    </p>
                    {section.text}
                  </>
                )}
                {section.header && (
                  <span>
                    <span className={`font-semibold text-xl mr-1`}>
                      {section.header} -{" "}
                    </span>
                    {section.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          className="absolute top-2 right-2 button-default p-0 text-white"
          onClick={onClose}
        >
          <RiCloseCircleFill size={30} />
        </button>
      </div>
    </div>
  );
};

export default InfoModal;
