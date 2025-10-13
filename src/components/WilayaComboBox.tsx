import React, { useState, useRef } from "react";

const ALGERIAN_WILAYAS = [
    "Adrar",
    "Aïn Defla",
    "Aïn Témouchent",
    "Alger",
    "Annaba",
    "Batna",
    "Béchar",
    "Béjaïa",
    "Béni Abbès",
    "Biskra",
    "Blida",
    "Bordj Badji Mokhtar",
    "Bordj Bou Arreridj",
    "Bouira",
    "Boumerdès",
    "Chlef",
    "Constantine",
    "Djanet",
    "Djelfa",
    "El Bayadh",
    "El Meniaa",
    "El M'Ghair",
    "El Oued",
    "El Tarf",
    "Ghardaïa",
    "Guelma",
    "Illizi",
    "In Guezzam",
    "In Salah",
    "Jijel",
    "Khenchela",
    "Laghouat",
    "Mascara",
    "Médéa",
    "Mila",
    "Mostaganem",
    "M'Sila",
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
    const displayedList =
        filtered.length <= 1 ? ALGERIAN_WILAYAS : filtered;

    const handleSelect = (wilaya: string) => {
        // setIsBtnClicked(false);
        onChange(wilaya);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    return (
        <div className="relative w-full">
            <div className="flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full border rounded-l-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Select or type Wilaya..."
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />

            </div>


            {isOpen && displayedList.length > 0 && (
                <ul className="absolute z-10 w-full text-black border rounded-lg bg-white shadow max-h-48 overflow-y-auto">
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
