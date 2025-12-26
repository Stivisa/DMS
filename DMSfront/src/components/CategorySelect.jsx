import React, { useState, useRef, useEffect } from "react";

const CategorySelect = ({
  className = "",
  value,
  onChange,
  disabled = false,
  options = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const filtered = options.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      const serialMatch = item.serialNumber?.toString().includes(searchLower);
      const nameMatch = item.name?.toLowerCase().includes(searchLower);
      const labelMatch = item.label?.toLowerCase().includes(searchLower);
      return serialMatch || nameMatch || labelMatch;
    });
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedValue) => {
    onChange({ target: { value: selectedValue } });
    setIsOpen(false);
    setSearchTerm("");
  };

  const getDisplayText = (itemId) => {
    const item = options.find((opt) => opt._id === itemId);
    if (!item) return "Izaberi kategoriju";
    
    const serialPart = item.serialNumber ? `${item.serialNumber}. ` : "";
    const keepPart = item.keepYears === 0 && item.keepMonths === 0
      ? "(trajno)"
      : `(${item.keepYears > 0 ? item.keepYears + " god." : ""}${
          item.keepMonths > 0 ? " " + item.keepMonths + " mes." : ""
        })`;
    const labelPart = item.label ? ` - ${item.label}` : "";
    
    return `${serialPart}${item.name} ${keepPart}${labelPart}`;
  };

  const formatOptionText = (item) => {
    const serialPart = item.serialNumber ? `${item.serialNumber}. ` : "";
    const keepPart = item.keepYears === 0 && item.keepMonths === 0
      ? "(trajno)"
      : `(${item.keepYears > 0 ? item.keepYears + " god." : ""}${
          item.keepMonths > 0 ? " " + item.keepMonths + " mes." : ""
        })`;
    const labelPart = item.label ? ` - ${item.label}` : "";
    
    return `${serialPart}${item.name} ${keepPart}${labelPart}`;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div
        className={`input-field flex items-center justify-between ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-800" : "text-gray-500"}>
          {value ? getDisplayText(value) : "Izaberi kategoriju"}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-400 rounded shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-300">
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
              placeholder="Pretraži kategoriju..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-64">
            <div
              className="p-2 hover:bg-emerald-100 cursor-pointer text-gray-500"
              onClick={() => handleSelect("")}
            >
              Izaberi kategoriju
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <div
                  key={item._id}
                  className={`p-2 hover:bg-emerald-100 cursor-pointer ${
                    value === item._id ? "bg-emerald-200" : ""
                  }`}
                  onClick={() => handleSelect(item._id)}
                >
                  {formatOptionText(item)}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-500 italic">Nema rezultata</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;