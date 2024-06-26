import React from 'react';
import { userRequest } from '../../utils/requestMethods';
import { FiDownload } from "react-icons/fi";
import { IoDocument } from "react-icons/io5";
import { RiCloseCircleFill } from "react-icons/ri";

const ModalFolderContent = ({ show, handleClose, files, folderId }) => {
  if (!show) return null;

  const handleShowFile = async (file) => {
    try {
      const response = await userRequest.get('document/file/download', {
        params: {
          folderId: folderId,
          fileName: file.name,
        },
        responseType: 'blob', // Important to handle binary data
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = file.name;
      downloadLink.click();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handlePreviewFile = async (file) => {
    try {
        const response = await userRequest.get('document/file/download', {
          params: {
            folderId: folderId,
            fileName: file.name,
          },
          responseType: 'blob',
        });
    
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const dataUrl = URL.createObjectURL(blob);
        window.open(dataUrl, "_blank");
        
        // Clean up the object URL after some time
        setTimeout(() => {
          URL.revokeObjectURL(dataUrl);
        }, 10000); // Adjust the time as necessary
    
      } catch (error) {
        console.error("Error previewing file:", error);
      }
    };

  return (
    <div
      onClick={handleClose}
      className="fixed w-full h-screen z-10 top-0 left-0 bg-gray-300 bg-opacity-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-1/2 max-h-screen justify-center rounded-3xl shadow bg-gray-50 border-4 border-gray-400 flex fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col p-2">      
          <h1 className="text-2xl text-gray-800 text-center py-2">Sadržaj foldera</h1>        
          <ul className='list-decimal list-inside overflow-y-auto px-4'>
          {files.map((file, index) => (
              <li key={index} className="list-item justify-between items-center pb-1 border-b border-gray-400">
                {file.name}
                <div className="flex items-center gap-2 mt-1"> 
                  <button
                    className="button-basic bg-purple-500 hover:bg-purple-600 items-center flex justify-center"
                    onClick={() => handleShowFile(file)}
                  >
                    <FiDownload className="text-2xl" />Preuzmi
                  </button>
                  {file.name.endsWith('.pdf') && (
                    <button
                      className="button-basic bg-purple-500 hover:bg-purple-600 items-center flex justify-center"
                      onClick={() => handlePreviewFile(file)}
                    >
                        <IoDocument className="text-2xl" />
                      Pregledaj
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>   
        </div>
        <button className="absolute top-2 right-2 button-default p-0 text-white" onClick={handleClose}><RiCloseCircleFill size={30}/></button>
      </div>
    </div>
  );
};

export default ModalFolderContent;
