import React from "react";

const SearchFilter = ({ sections }) => {
  return (
    <>
      {sections.map((section, index) => (
        <div key={index} className="flex items-center">
        <h1 className="text-lg text-default font-semibold">{section.title}:</h1>
        <p>
          <input
            id={index}
            placeholder={section.placeholder}
            className="input-field ml-1"
            type={section.type}
            onChange={section.onChange}
          />
        </p>
        </div>
      ))}
      </>
  );
};

export default SearchFilter;
