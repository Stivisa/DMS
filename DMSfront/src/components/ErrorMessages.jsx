import React from "react";

const ErrorMessages = ({ errors }) => {
  if (!errors || Object.keys(errors).length === 0) return null;

  return (
    <div className="flex min-h-4 items-center justify-center">
      <div className="text-error ml-1">
        {Object.keys(errors).map((key) => (
          <p key={key}>{errors[key]}</p>
        ))}
      </div>
    </div>
  );
};

export default ErrorMessages;
