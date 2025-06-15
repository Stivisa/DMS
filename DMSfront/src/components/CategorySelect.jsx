import React from "react";

const CategorySelect = ({
  className = "",
  value,
  onChange,
  disabled = false,
  options = [],
}) => {
  return (
    <select
      className={`input-field ${className}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="">Izaberi kategoriju</option>
      {options.length > 0 &&
        options.map((item) => (
          <option key={item._id} value={item._id}>
            {item.name}{" "}
            {item.keepYears === 0 && item.keepMonths === 0
              ? "(trajno)"
              : `(${item.keepYears > 0 ? item.keepYears + " god." : ""}${
                  item.keepMonths > 0 ? " " + item.keepMonths + " mes." : ""
                })`}
            {item.label ? ` - ${item.label}` : ""}
          </option>
        ))}
    </select>
  );
};

export default CategorySelect;