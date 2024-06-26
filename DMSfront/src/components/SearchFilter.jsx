import React from 'react';

const SearchFilter = ({ sections }) => {
  return (
    <div className="w-full px-2 p-1 border rounded-lg bg-white flex items-center">
      <h1 className="text-lg text-color font-semibold">Pretraga:</h1>
      {sections.map((section, index) => (
        <div key={index} className="flex items-center">
          <input
            id={index}
            placeholder={section.placeholder}
            className="input-field ml-1"
            type={section.type}
            onChange={section.onChange}
          />
        </div>
      ))}
    </div>
  );
};

export default SearchFilter;