import React from "react";

const LoadingModal = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-4">Molimo sačekajte...</h2>
        <div className="w-10 h-10 border-4 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default LoadingModal;