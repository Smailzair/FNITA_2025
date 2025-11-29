import React, { useState, useRef } from "react";

const ALGERIAN_WILAYAS = [
  "Adrar",
  "Aflou",
  "Aïn Defla",
  "Aïn Oussera",
  "Aïn Témouchent",
  "Algiers",
  "Annaba",
  "Barika",
  "Batna",
  "Béchar",
  "Béjaïa",
  "Bir El Ater",
  "Biskra",
  "Blida",
  "Bordj Bou Arréridj",
  "Bordj Baji Mokhtar",
  "Bou Saâda",
  "Bouira",
  "Boumerdès",
  "Béni Abbès",
  "Chlef",
  "Constantine",
  "Djanet",
  "Djelfa",
  "El Abiodh Sidi Cheikh",
  "El Aricha",
  "El Bayadh",
  "El Kantara",
  "El M'ghair",
  "El Menia",
  "El Oued",
  "El Tarf",
  "Ghardaïa",
  "Guelma",
  "Illizi",
  "In Guezzam",
  "In Salah",
  "Jijel",
  "Khenchela",
  "Ksar Chellala",
  "Ksar El Boukhari",
  "Laghouat",
  "M'Sila",
  "Mascara",
  "Messaâd",
  "Médéa",
  "Mila",
  "Mostaganem",
  "Naâma",
  "Oran",
  "Ouargla",
  "Ouled Djellal",
  "Oum El Bouaghi",
  "Relizane",
  "Saïda",
  "Sétif",
  "Sidi Bel Abbès",
  "Skikda",
  "Souk Ahras",
  "Tamanrasset",
  "Tébessa",
  "Tiaret",
  "Timimoun",
  "Tindouf",
  "Tipaza",
  "Tissemsilt",
  "Tizi Ouzou",
  "Tlemcen",
  "Touggourt",
];

interface WilayaComboBoxProps {
  value: string;
  onChange: (value: string) => void;
}

const WilayaComboBox: React.FC<WilayaComboBoxProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter the list
  const filtered = ALGERIAN_WILAYAS.filter((w) =>
    w.toLowerCase().includes(value.toLowerCase())
  );

  // If filtered result has exactly one element, show all wilayas instead
  const displayedList = filtered.length <= 1 ? ALGERIAN_WILAYAS : filtered;

  const handleSelect = (wilaya: string) => {
    // setIsBtnClicked(false);
    onChange(wilaya);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-45  m-1">
      <div className="flex items-center">
        <input
          ref={inputRef}
          type="text"
          className="text-gray-500 w-full pl-1 border rounded-l-lg"
          placeholder="Wilaya"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 100)} // Delay to allow click
        />
      </div>

      {isOpen && displayedList.length > 0 && (
        <ul className="absolute z-10 w-full text-black border rounded-lg bg-white shadow max-h-48 overflow-y-auto  text-xs md:text-sm">
          {displayedList.map((wilaya) => (
            <li
              key={wilaya}
              className="p-2 hover:bg-blue-100 cursor-pointer"
              onMouseDown={() => handleSelect(wilaya)} // keeps selection visible
            >
              {wilaya}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WilayaComboBox;
