import { useState, useEffect, FormEvent } from "react";
import { supabase } from "../../api/supabaseClient";
import OwnerForm from "./OwnerForm";

type Animal = {
  id?: string;
  nme: string | null;
  num_ident: string | null;
  num_passport: string | null;
  propr_id: string | null;
  espece: string | null;
  race: string | null;
  sexe: string | null;
  niss_date: string | null; // Use string for input compatibility
  robe: string | null;
  descr: string | null;
  is_radiated: boolean | null;
  radiat_date: string | null;
  radiat_reason: string | null;
};

type Owner = {
  id: string;
  nme: string;
};

const especeOptions = [
  "Canine",
  "Feline",
  "Equine",
  "Ovine",
  "Caprine",
  "Oiseaux",
  "Reptile",
  "Rongeur",
  "Bovine",
  "Camélidé",
];

const raceOptions = [
  "Husky Siberien",
  "Jack Russel",
  "Jagdterrier",
  "Komodor",
  "Korthals",
  "Labrador",
  "Levrier Afghan",
  "Levrier Espagnol",
  "Lhassa Apso",
  "Main Coon",
  "Malamute de l'Alaska",
  "Pekinois",
  "Persan",
  "Perroquet",
  "Perruche",
  "Pinscher",
  "Pit Bull",
  "Podenco",
  "Pointer",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Saint-Bernard",
  "Saluki",
  "Savannah",
  "Samoyede",
  "Schnauzer",
  "Schnauzer Geant",
  "Schnauzer Moyen",
  "Schnauzer Nain",
  "Scottish Terrier",
  "Setter Anglais",
  "Setter Gordon",
  "Setter Irlandais",
  "Shar-pei",
  "Shiba Inu",
  "Shih Tzu",
  "Siamois",
  "Sloughi",
  "Spitz Japonais",
  "Spitz Nain",
  "Sphynx",
  "Staffordshire Bull Terrier",
  "Teckel",
  "Teckel à poil dur",
  "Teckel à poil long",
  "Teckel Nain",
  "Terre Neuve",
  "Terrier Tibétain",
  "Westhiland West terrier",
  "Whippet",
  "Yorkshire Terrier",
];

const raceByEspece: Record<string, string[]> = {
  Canine: [
    "Husky Siberien",
    "Jack Russel",
    "Jagdterrier",
    "Komodor",
    "Korthals",
    "Labrador",
    "Levrier Afghan",
    "Levrier Espagnol",
    "Lhassa Apso",
    "Malamute de l'Alaska",
    "Pekinois",
    "Pinscher",
    "Pit Bull",
    "Podenco",
    "Pointer",
    "Rhodesian Ridgeback",
    "Rottweiler",
    "Saint-Bernard",
    "Saluki",
    "Samoyede",
    "Schnauzer",
    "Schnauzer Geant",
    "Schnauzer Moyen",
    "Schnauzer Nain",
    "Scottish Terrier",
    "Setter Anglais",
    "Setter Gordon",
    "Setter Irlandais",
    "Shar-pei",
    "Shiba Inu",
    "Shih Tzu",
    "Sloughi",
    "Spitz Japonais",
    "Spitz Nain",
    "Staffordshire Bull Terrier",
    "Teckel",
    "Teckel à poil dur",
    "Teckel à poil long",
    "Teckel Nain",
    "Terre Neuve",
    "Terrier Tibétain",
    "Westhiland West terrier",
    "Whippet",
    "Yorkshire Terrier",
  ],
  Feline: ["Main Coon", "Persan", "Savannah", "Siamois", "Sphynx"],
  Oiseaux: ["Perroquet", "Perruche"],
  // Other species from your list don't have a clear mapping in the provided race list.
  // They will show all races by default unless you add mappings for them.
  Equine: [],
  Ovine: [],
  Caprine: [],
  Reptile: [],
  Rongeur: [],
  Bovine: [],
  Camélidé: [],
};

type AnimalFormProps = {
  animal: Partial<Animal> | null;
  owners: Owner[];
  onOwnerAdded: () => Promise<void>;
  onSave: () => void;
  onClose: () => void;
};

export default function AnimalForm({
  animal,
  owners,
  onOwnerAdded,
  onSave,
  onClose,
}: AnimalFormProps) {
  const [formData, setFormData] = useState<Partial<Animal>>({
    nme: "",
    num_ident: "",
    num_passport: "",
    propr_id: null,
    espece: "",
    race: "",
    sexe: "Mâle",
    niss_date: "",
    robe: "",
    descr: "",
    is_radiated: false,
    radiat_date: "",
    radiat_reason: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredRaceOptions, setFilteredRaceOptions] = useState(raceOptions);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  const isEditing = animal && animal.id;

  useEffect(() => {
    if (animal) {
      // Format date for input type="date"
      const formattedDate = animal.niss_date
        ? new Date(animal.niss_date).toISOString().split("T")[0]
        : "";
      const formattedRadiatDate = (animal as any).radiat_date
        ? new Date((animal as any).radiat_date).toISOString().split("T")[0]
        : "";

      // Check if espece/race are custom values
      const isCustomEspece =
        animal.espece && !especeOptions.includes(animal.espece);
      const isCustomRace = animal.race && !raceOptions.includes(animal.race);

      setFormData({
        ...animal,
        niss_date: formattedDate,
        radiat_date: formattedRadiatDate,
        // If the value is custom, set the dropdown to 'Autre'
        // The text input will then be populated by the value from the `animal` object spread
        espece: isCustomEspece ? "Autre" : animal.espece,
        race: isCustomRace ? "Autre" : animal.race,
      });
    }
  }, [animal]);

  useEffect(() => {
    const selectedEspece = formData.espece;
    if (selectedEspece && raceByEspece[selectedEspece]) {
      setFilteredRaceOptions(raceByEspece[selectedEspece]);
    } else {
      // If no species is selected, or it's not in our map, show all races
      setFilteredRaceOptions(raceOptions);
    }
  }, [formData.espece]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const newState = { ...prev, [name]: isCheckbox ? checked : value };

      if (name === "is_radiated") {
        if (checked) {
          // Default radiate date to today when checked
          newState.radiat_date = new Date().toISOString().split("T")[0];
        } else {
          // Clear date and reason if unchecked
          newState.radiat_date = "";
          newState.radiat_reason = "";
        }
      } else if (name === "espece") {
        const newRaces = raceByEspece[value] || raceOptions;
        if (!newRaces.includes(prev.race || "")) {
          newState.race = "";
        }
      }
      return newState;
    });
  };

  // This function will be used for the 'Autre' text inputs
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { id, ...submissionData } = {
      ...formData,
      niss_date: formData.niss_date || null,
      propr_id: formData.propr_id || null,
      radiat_date: formData.is_radiated ? formData.radiat_date || null : null,
      radiat_reason: formData.is_radiated
        ? formData.radiat_reason || null
        : null,
      created_by_email: user?.email, // Add the user's email
    };

    try {
      let response;

      if (isEditing && animal) {
        // For updates, we use the submissionData as is
        const { created_by_email, owner_name, owner, ...updateData } =
          submissionData as any;
        response = await supabase
          .from("tb_animals")
          .update(updateData)
          .eq("id", animal.id as string);
      } else {
        console.log("Submission Data:", submissionData);
        // For inserts, the `id` is already removed from submissionData
        response = await supabase.from("tb_animals").insert([submissionData]);
      }

      if (response.error) {
        throw response.error;
      }

      onSave();
    } catch (err: any) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewOwnerSaved = async (newOwner: Owner) => {
    await onOwnerAdded(); // Refresh the owner list in the parent
    setFormData((prev) => ({ ...prev, propr_id: newOwner.id })); // Pre-select the new owner
    setIsOwnerModalOpen(false);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
      <h2 className="text-gray-900 text-2xl font-bold mb-6">
        {isEditing ? "Modifier l'animal" : "Ajouter un animal"}
      </h2>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-gray-900">
          <div>
            <label
              htmlFor="nme"
              className="block text-sm font-medium text-gray-700"
            >
              Nom
            </label>
            <input
              id="nme"
              name="nme"
              value={formData.nme || ""}
              onChange={handleChange}
              placeholder="Nom"
              className="p-1 border rounded w-full"
              required
            />
          </div>
          <div>
            <label
              htmlFor="num_ident"
              className="block text-sm font-medium text-gray-700"
            >
              N° Identification
            </label>
            <input
              id="num_ident"
              name="num_ident"
              value={formData.num_ident || ""}
              onChange={handleChange}
              placeholder="N° Identification"
              className="p-1 border rounded w-full"
            />
          </div>
          <div>
            <label
              htmlFor="num_passport"
              className="block text-sm font-medium text-gray-700"
            >
              N° Passeport
            </label>
            <input
              id="num_passport"
              name="num_passport"
              value={formData.num_passport || ""}
              onChange={handleChange}
              placeholder="N° Passeport"
              className="p-1 border rounded w-full"
            />
          </div>
          <div>
            <label
              htmlFor="propr_id"
              className="block text-sm font-medium text-gray-700"
            >
              * Propriétaire
            </label>
            <div className="flex items-center gap-2">
              <select
                id="propr_id"
                name="propr_id"
                value={formData.propr_id || ""}
                onChange={handleChange}
                className="p-1 border rounded w-full text-gray-900 bg-white"
                required
              >
                <option value="" disabled>
                  Sélectionner un propriétaire
                </option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.nme}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsOwnerModalOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-3 rounded"
                title="Ajouter un nouveau propriétaire"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="espece"
              className="block text-sm font-medium text-gray-700"
            >
              Espèce
            </label>
            <select
              id="espece"
              name="espece"
              value={formData.espece || ""}
              onChange={handleChange}
              className="p-1 border rounded w-full text-gray-900 bg-white"
              required
            >
              <option value="">Sélectionner une espèce</option>
              {especeOptions.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
              <option value="Autre">Autre...</option>
            </select>
            {formData.espece === "Autre" && (
              <input
                type="text"
                // Use a different name to avoid conflict or handle it in the state logic
                // Here we directly set the espece field
                value={
                  especeOptions.includes(animal?.espece || "")
                    ? ""
                    : animal?.espece || ""
                }
                onChange={handleCustomChange}
                name="espece" // Keep the name to update the correct field
                placeholder="Préciser l'espèce"
                className="mt-1 p-1 border rounded w-full"
              />
            )}
          </div>
          <div>
            <label
              htmlFor="race"
              className="block text-sm font-medium text-gray-700"
            >
              Race
            </label>
            <select
              id="race"
              name="race"
              value={formData.race || ""}
              onChange={handleChange}
              className="p-1 border rounded w-full text-gray-900 bg-white"
            >
              <option value="">Sélectionner une race</option>
              {filteredRaceOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Autre">Autre...</option>
            </select>
            {formData.race === "Autre" && (
              <input
                type="text"
                name="race"
                // Use a different name to avoid conflict or handle it in the state logic
                value={
                  raceOptions.includes(animal?.race || "")
                    ? ""
                    : animal?.race || ""
                }
                onChange={handleCustomChange}
                placeholder="Préciser la race"
                className="mt-1 p-1 border rounded w-full"
              />
            )}
          </div>
          <div>
            <label
              htmlFor="sexe"
              className="block text-sm font-medium text-gray-700"
            >
              Sexe
            </label>
            <select
              id="sexe"
              name="sexe"
              value={formData.sexe || ""}
              onChange={handleChange}
              className="p-1 border rounded w-full text-gray-900 bg-white"
            >
              <option value="Mâle">Mâle</option>
              <option value="Femelle">Femelle</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="niss_date"
              className="block text-sm font-medium text-gray-700"
            >
              Date de Naissance
            </label>
            <div className="relative">
              <input
                id="niss_date"
                name="niss_date"
                type="date"
                value={formData.niss_date || ""}
                onChange={handleChange}
                className="p-1 border rounded w-full text-gray-900 appearance-none"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 11H5V13H9V11ZM15 11H11V13H15V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="robe"
              className="block text-sm font-medium text-gray-700"
            >
              Robe
            </label>
            <input
              id="robe"
              name="robe"
              value={formData.robe || ""}
              onChange={handleChange}
              placeholder="Robe"
              className="p-1 border rounded w-full"
            />
          </div>
        </div>
        <label
          htmlFor="descr"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="descr"
          name="descr"
          value={formData.descr || ""}
          onChange={handleChange}
          placeholder="Description"
          className="text-gray-900 p-1 border rounded w-full"
        />
        <div className="border-t border-gray-300 pt-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_radiated"
              checked={!!formData.is_radiated}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-gray-700 font-medium">Radié</span>
          </label>
        </div>

        {formData.is_radiated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div>
              <label
                htmlFor="radiat_date"
                className="block text-sm font-medium text-gray-700"
              >
                Date de radiation
              </label>
              <div className="relative">
                <input
                  id="radiat_date"
                  name="radiat_date"
                  type="date"
                  value={formData.radiat_date || ""}
                  onChange={handleChange}
                  className="p-1 border rounded w-full text-gray-900 appearance-none"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 11H5V13H9V11ZM15 11H11V13H15V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="radiat_reason"
                className="block text-sm font-medium text-gray-700"
              >
                Motif de radiation
              </label>
              <input
                id="radiat_reason"
                name="radiat_reason"
                value={formData.radiat_reason || ""}
                onChange={handleChange}
                placeholder="Ex: Décès, Vente..."
                className="p-1 border rounded w-full text-gray-900"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-300 rounded hover:bg-gray-400"
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="py-2 px-4 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-cyan-300"
            disabled={isSaving}
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
      {isOwnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <OwnerForm
            onClose={() => setIsOwnerModalOpen(false)}
            onSave={handleNewOwnerSaved}
          />
        </div>
      )}
    </div>
  );
}
