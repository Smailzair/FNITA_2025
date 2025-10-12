import React, { useState, useRef, useEffect } from "react";

const SearchDropdown = ({
  options,
  placeholder,
  handleChangetoparent,
  className,
}: {
  options: string[];
  placeholder: string;
  handleChangetoparent: (value: string) => void;
  className?: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const inputRef = useRef<HTMLDivElement>(null);

  const handleSearch = (query: string) => {
    const filtered = query.trim() === "" ? options : options.filter((option) =>
      option.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOptions(filtered);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    handleSearch(newSearchTerm);
    handleChangetoparent(newSearchTerm);
    setDropdownVisible(newSearchTerm !== "");



  };

  const handleItemClick = (option: string) => {
    setSelectedOption(option);
    setSearchTerm(option);
    handleChangetoparent(option);
    setDropdownVisible(false);

  };



  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setDropdownVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  return (
    <div className="relative" ref={inputRef}>

      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        onClick={handleToggleDropdown}
        placeholder={placeholder}
        className={className || "m-1 rounded-md text-black pl-1 w-30"}
      />

      {dropdownVisible && filteredOptions.length > 0 && (
        <ul className="absolute z-10 bg-white text-black border border-gray-300 mt-1 p-2 rounded max-h-40 overflow-y-auto">
          {filteredOptions.map((option) => (
            <li
              key={option}
              className={`cursor-pointer ${selectedOption === option ? "bg-gray-200" : ""
                }`}
              onClick={() => handleItemClick(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchDropdown;
