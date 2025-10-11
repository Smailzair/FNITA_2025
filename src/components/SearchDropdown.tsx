import React, { useState, useRef, useEffect } from "react";

const SearchDropdown = ({
  options,
  placeholder,
  handleChangetoparent,
}: {
  options: string[];
  placeholder: string;
  handleChangetoparent: (value: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const inputRef = useRef<HTMLDivElement>(null);

  const handleSearch = (query: string) => {
    const filtered = options.filter((option) =>
      option.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOptions(filtered);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    handleSearch(newSearchTerm);
    setDropdownVisible(newSearchTerm !== "");
    handleChangetoparent(newSearchTerm);
  };

  const handleItemClick = (option: string) => {
    setSelectedOption(option);
    setSearchTerm(option);
    setDropdownVisible(false);
    handleChangetoparent(option);
  };

  const handleToggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
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

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        onClick={handleToggleDropdown}
        placeholder={placeholder}
        className="m-1 rounded-md text-black pl-1 w-30"
      />
      {dropdownVisible && filteredOptions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 mt-1 p-2 rounded max-h-40 overflow-y-auto">
          {filteredOptions.map((option) => (
            <li
              key={option}
              className={`cursor-pointer ${
                selectedOption === option ? "bg-gray-200" : ""
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
