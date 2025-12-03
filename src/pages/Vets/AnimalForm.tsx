import type { FormEvent } from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../api/supabaseClient";
import type { Animal } from "../animal";
import { useAuth } from "../../hooks/useAuth";
import OwnerForm from "./OwnerForm";

type Owner = {
  id: string;
  nme: string;
  fam_nme: string;
  tel?: string | null;
  email?: string | null;
  adresse?: string | null;
  wilaya?: string | null;
  city?: string | null;
  code_postal?: string | null;
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

const radiationReasons = [
  "Décès",
  "Vente",
  "Perdu",
  "Retrouvé par propriétaire",
];

type AnimalFormProps = {
  animal: Partial<Animal> | null;
  owners: Owner[];
  animals: Animal[];
  onOwnerAdded: () => Promise<void>;
  onSave: () => void;
  onClose: () => void;
  onAnimalChange: (animal: Animal) => void;
};

// Create a specific type for the form data to handle date strings
type AnimalFormData = Omit<Partial<Animal>, "niss_date" | "radiat_date"> & {
  niss_date?: string;
  radiat_date?: string;
  qr_code_identifier?: string | null;
  qr_code_status?: string | null;
  password?: string | null;
};

const speciesImageFiles: Record<string, string> = {
  Canine: "Canine.png",
  Feline: "Feline.png",
  Equine: "Equine.png",
  Ovine: "Ovine.png",
  Caprine: "Caprine.png",
  Oiseaux: "Oiseaux.png",
  Reptile: "Reptile.png",
  Rongeur: "Rongeur.png",
  Bovine: "Bovine.png",
  Camélidé: "Camélidé.png",
};

const SpeciesIcon = ({ species }: { species: string | null | undefined }) => {
  const imageName =
    species && speciesImageFiles[species] ? speciesImageFiles[species] : null;

  if (!imageName) {
    return null; // Render nothing if no specific icon is found
  }

  return (
    <img
      src={`/Anims/${imageName}`}
      alt={species || "Animal"}
      className="h-12 w-12 object-contain"
    />
  );
};

export default function AnimalForm({
  animal,
  owners,
  animals,
  onOwnerAdded,
  onSave,
  onClose,
  onAnimalChange,
}: AnimalFormProps) {
  const [formData, setFormData] = useState<AnimalFormData>({
    nme: "",
    num_ident: "",
    num_passport: "",
    propr_id: null,
    espece: "",
    race: "",
    sexe: "Mâle",
    niss_date: "", // Keep as string for the input
    robe: "",
    descr: "",
    is_radiated: false,
    radiat_date: "", // Keep as string for the input
    radiat_reason: "",
    qr_code_identifier: "",
    qr_code_status: "none",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredRaceOptions, setFilteredRaceOptions] = useState(raceOptions);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const { role } = useAuth();
  const { user } = useAuth();
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);
  const ownerInputRef = useRef<HTMLDivElement | null>(null);
  const [numIdentError, setNumIdentError] = useState<string | null>(null);
  const [isCheckingNumIdent, setIsCheckingNumIdent] = useState(false);

  const isEditing = animal && animal.id;

  const ownersAnimalIds = useMemo(() => {
    // Extract and memoize the list of animal IDs
    return animals.map((animal) => animal.id as string);
  }, [animals]);

  const currentIndex = useMemo(() => {
    if (!animal?.id) return 0;
    const index = ownersAnimalIds.indexOf(animal.id);
    return index >= 0 ? index + 1 : 0;
  }, [animal?.id, ownersAnimalIds]);

  const isFirstAnimal = useMemo(() => {
    // Check if the current animal is the first in the list
    return animal?.id ? ownersAnimalIds.indexOf(animal.id) === 0 : true;
  }, [animal?.id, ownersAnimalIds]);

  const isLastAnimal = useMemo(() => {
    // Check if the current animal is the last in the list
    return animal?.id
      ? ownersAnimalIds.indexOf(animal.id) === ownersAnimalIds.length - 1
      : true;
  }, [animal?.id, ownersAnimalIds]);

  const goToPreviousAnimal = () => {
    if (!animal?.id) return;

    const currentIndex = ownersAnimalIds.indexOf(animal.id);
    if (currentIndex > 0) {
      const previousAnimalId = ownersAnimalIds[currentIndex - 1];
      const previousAnimal = animals.find((a) => a.id === previousAnimalId);
      if (previousAnimal) {
        onAnimalChange(previousAnimal as Animal);
      }
    }
  };

  const goToNextAnimal = () => {
    if (!animal?.id) return;

    const currentIndex = ownersAnimalIds.indexOf(animal.id);
    if (currentIndex < ownersAnimalIds.length - 1) {
      const nextAnimalId = ownersAnimalIds[currentIndex + 1];
      const nextAnimal = animals.find((a) => a.id === nextAnimalId);
      if (nextAnimal) {
        onAnimalChange(nextAnimal as Animal);
      }
    }
  };

  useEffect(() => {
    if (animal) {
      // Format date for input type="date"
      const formattedNissDate = animal.niss_date
        ? new Date(animal.niss_date).toISOString().split("T")[0]
        : "";
      const formattedRadiatDate = animal.radiat_date
        ? new Date(animal.radiat_date).toISOString().split("T")[0]
        : "";

      // Check if espece/race are custom values
      const isCustomEspece =
        animal.espece && !especeOptions.includes(animal.espece);
      const isCustomRadiatReason =
        animal.radiat_reason &&
        !radiationReasons.includes(animal.radiat_reason);

      const isCustomRace = animal.race && !raceOptions.includes(animal.race);

      setFormData({
        ...animal,
        niss_date: formattedNissDate,
        radiat_date: formattedRadiatDate, // This will be a string
        // If the value is custom, set the dropdown to 'Autre'
        // The text input will then be populated by the value from the `animal` object spread
        espece: isCustomEspece ? "Autre" : animal.espece,
        radiat_reason: isCustomRadiatReason ? "Autre" : animal.radiat_reason,
        race: isCustomRace ? "Autre" : animal.race,
      });
      const owner = owners.find((o) => o.id === animal.propr_id);
      setOwnerSearch(owner ? `${owner.nme} ${owner.fam_nme || ""}`.trim() : "");
    } else {
      // Reset for new animal form
      setOwnerSearch("");
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
  }, [formData.espece, animal]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        ownerInputRef.current &&
        !ownerInputRef.current.contains(event.target as Node)
      ) {
        setShowOwnerSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [ownerInputRef]);

  // Clear num_ident error when form opens/closes or animal changes
  useEffect(() => {
    setNumIdentError(null);
  }, [animal]);

  const handleNumIdentBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    void checkNumIdentUniqueness(e.target.value);
  };

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

      if (name === "num_ident") {
        const sanitizedValue = value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 15);
        newState.num_ident = sanitizedValue;
      }

      if (name === "password") {
        const sanitizedValue = value.replace(/\s/g, "");
        newState.password = sanitizedValue;
      }

      if (name === "is_radiated") {
        if (checked) {
          // Default radiate date to today when checked
          newState.radiat_date = new Date().toISOString().split("T")[0];
          // Default reason to empty to force user selection
          newState.radiat_reason = "";
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

  const handleOwnerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchText = e.target.value;
    setOwnerSearch(searchText);
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const searchTerms = searchLower.split(" ").filter(Boolean);

      const filtered = owners.filter((owner) => {
        const ownerNameLower = owner.nme.toLowerCase();
        const ownerFamNameLower = owner.fam_nme?.toLowerCase() || "";
        const fullName = `${ownerNameLower} ${ownerFamNameLower}`;
        const reversedFullName = `${ownerFamNameLower} ${ownerNameLower}`;

        // Handle single search term (matches first or last name)
        if (searchTerms.length === 1) {
          return (
            ownerNameLower.includes(searchLower) ||
            ownerFamNameLower.includes(searchLower)
          );
        }

        // Handle multiple search terms (e.g., "firstname lastname")
        return (
          fullName.includes(searchLower) ||
          reversedFullName.includes(searchLower)
        );
      });
      setFilteredOwners(filtered);
      setShowOwnerSuggestions(true);
    } else {
      setFilteredOwners([]);
      setShowOwnerSuggestions(false);
      setFormData((prev) => ({ ...prev, propr_id: null }));
    }
  };

  const handleOwnerSelect = (owner: Owner) => {
    setFormData((prev) => ({ ...prev, propr_id: owner.id }));
    setOwnerSearch(`${owner.nme} ${owner.fam_nme || ""}`.trim());
    setShowOwnerSuggestions(false);
    setFilteredOwners([]);
  };

  const toggleSexe = () => {
    setFormData((prev) => ({
      ...prev,
      sexe: prev.sexe === "Mâle" ? "Femelle" : "Mâle",
    }));
  };

  const handleOwnerBlur = () => {
    // We use a small timeout to allow a click on a suggestion to be processed
    // before we validate the field.
    setTimeout(() => {
      setShowOwnerSuggestions(false);
    }, 150); // 150ms delay
  };

  const checkNumIdentUniqueness = async (ident: string) => {
    if (!ident) {
      setNumIdentError(null);
      return;
    }

    // If editing and the number hasn't changed, it's valid for this animal.
    if (isEditing && animal?.num_ident === ident) {
      setNumIdentError(null);
      return;
    }

    setIsCheckingNumIdent(true);
    setNumIdentError(null);
    try {
      const { data, error } = await supabase
        .from("tb_animals")
        .select("id")
        .eq("num_ident", ident)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setNumIdentError("Ce numéro d'identification est déjà utilisé.");
      } else {
        setNumIdentError(null); // It's unique
      }
    } catch (err) {
      setNumIdentError("Erreur lors de la vérification du numéro.");
    } finally {
      setIsCheckingNumIdent(false);
    }
  };

  const generateUniqueId = async () => {
    setIsCheckingNumIdent(true);
    let newId = "";
    let isUnique = false;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    while (!isUnique) {
      newId = Array.from({ length: 15 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join("");

      const { data } = await supabase
        .from("tb_animals")
        .select("id")
        .eq("num_ident", newId);
      if (data && data.length === 0) isUnique = true;
    }
    setFormData((prev) => ({ ...prev, num_ident: newId }));
    setIsCheckingNumIdent(false);
    setNumIdentError(null);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const newPassword = Array.from({ length: 11 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
    setFormData((prev) => ({ ...prev, password: newPassword }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (numIdentError) {
      setError("Veuillez corriger les erreurs avant de sauvegarder.");
      setIsSaving(false);
      return;
    }

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
        const { created_by_email, owner, owner_name, ...updateData } =
          submissionData;
        response = await supabase
          .from("tb_animals")
          .update(updateData)
          .eq("id", animal.id as string);
      } else {
        console.log("Submission Data:", submissionData);
        // For inserts, the `id` is already removed from submissionData
        const { owner, owner_name, ...insertData } = submissionData;
        response = await supabase.from("tb_animals").insert([insertData]);
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

  const handleDelete = async () => {
    if (!isEditing || !animal?.id) return;

    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cet animal ? Cette action est irréversible."
      )
    ) {
      setIsDeleting(true);
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from("tb_animals")
          .delete()
          .eq("id", animal.id);

        if (deleteError) {
          throw deleteError;
        }
        onSave(); // To close modal and refresh list
      } catch (err: any) {
        setError(`Erreur lors de la suppression: ${err.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleNewOwnerSaved = async (newOwner: Owner) => {
    await onOwnerAdded(); // Refresh the owner list in the parent
    setFormData((prev) => ({ ...prev, propr_id: newOwner.id })); // Pre-select the new owner
    setOwnerSearch(`${newOwner.nme} ${newOwner.fam_nme || ""}`.trim()); // Update the search input text
    setIsOwnerModalOpen(false);
  };
  const [ownerSearch, setOwnerSearch] = useState("");

  const handleGenerateCertificate = () => {
    if (!animal || !animal.id) {
      alert("Veuillez d'abord enregistrer l'animal.");
      return;
    }

    const selectedOwner = owners.find((o) => o.id === formData.propr_id);

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // Render the React component to an HTML string
      printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificat d'Identification de l'Animal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        background-color: #f3f4f6; /* bg-gray-100 */
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        
        margin: 1rem auto;
        background: white;
        box-shadow: 0 0 0.5cm rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
      }
      .header {
        //padding-bottom: 1rem;
        padding : 3mm;
        border-bottom: 2px solid #e5e7eb; /* border-gray-200 */
        margin-bottom: 2rem;
        display: flex;
        //justify-content: space-between;
        align-items: center;
        background-color: teal;
      }
      .content {
        flex-grow: 1;
        padding-left : 10mm;
        padding-right : 10mm;
      }
      .footer {
        padding-top: ;
        padding-bottom: 2mm;
        border-top: 1px solid #e5e7eb; /* border-gray-200 */
        margin-top: 2rem;
        font-size: 0.875rem; /* text-sm */
        text-align: center;
        color: white; /* text-gray-500 */
        background-color: teal;
      }
      @media print {
        body,
        .page {
          margin: 0;
          box-shadow: none;
          background: white;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="header">
         <img 
  src="data:image/png;base64,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" 
  alt="Embedded Icon"
  class="w-20 h-20"
/>
        <div class="text-center w-full">
          <p class="text-sm text-white">
            République algérienne démocratique et populaire</br>
Ministère de l'Agriculture et du Développement Rural</br>
Fichier National d'Identification et Traçabilité Animale
          </p>
          
        </div>
       
      </header>

      <main class="content">
        <h1 class="text-center pb-5 text-2xl font-bold text-gray-800">
            Certificat d'Identification d'animal
          </h1>
        <section class="mb-8">
          <h2
            class="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4 text-gray-700"
          >
            Informations sur le Propriétaire
          </h2>
          <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
            <p><strong>Nom Complet:</strong> Jean Dupont</p>
            <p><strong>Contact:</strong> 0123456789</p>
            <p class="col-span-2">
              <strong>Adresse:</strong> 123 Rue de la République, 75001 Paris,
              France
            </p>
          </div>
        </section>

        <section class="mb-8">
          <h2
            class="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4 text-gray-700"
          >
            Informations sur l'Animal
          </h2>
          <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
            <p><strong>Nom:</strong> Médor</p>
            <p><strong>Espèce:</strong> Canine</p>
            <p><strong>Race:</strong> Berger Allemand</p>
            <p><strong>Sexe:</strong> Mâle</p>
            <p><strong>Date de Naissance:</strong> 01/01/2022</p>
            <p><strong>Robe:</strong> Noir et feu</p>
          </div>
        </section>

        <section class="mb-8">
          <h2
            class="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4 text-gray-700"
          >
            Identification et Sécurité
          </h2>
          <div
            class="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-4 rounded-lg"
          >
            <p>
              <strong>N° Identification:</strong>
              <span class="font-mono text-base">ABC123DEF456GHI</span>
            </p>
            <p>
              <strong>Mot de passe:</strong>
              <span class="font-mono text-base">XYZ123ABC45</span>
            </p>
          </div>
        </section>
      </main>

      <footer class="footer">
        <p>Certificat généré le 01/01/2025.</p>
        <p class="mt-2">
          <strong>Vétérinaire Traitant:</strong> vet@email.com
        </p>
      </footer>
    </div>
  </body>
</html>
      `);
      // printWindow.document.write(`
      //   <html>
      //     <head>
      //       <title>Certificat d'Identification de l'Animal</title>
      //       <script src="https://cdn.tailwindcss.com"></script>
      //       <style>
      //         body {
      //           background-color: #f3f4f6; /* bg-gray-100 */
      //           -webkit-print-color-adjust: exact;
      //           color-adjust: exact;
      //         }
      //         .page {
      //           width: 210mm;
      //           min-height: 297mm;
      //           padding: 20mm;
      //           margin: 1rem auto;
      //           background: white;
      //           box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
      //           display: flex;
      //           flex-direction: column;
      //         }
      //         .header {
      //           padding-bottom: 1rem;
      //           border-bottom: 2px solid #e5e7eb; /* border-gray-200 */
      //           margin-bottom: 2rem;
      //           display: flex;
      //           justify-content: space-between;
      //           align-items: center;
      //         }
      //         .content {
      //           flex-grow: 1;
      //         }
      //         .footer {
      //           padding-top: 1rem;
      //           border-top: 1px solid #e5e7eb; /* border-gray-200 */
      //           margin-top: 2rem;
      //           font-size: 0.875rem; /* text-sm */
      //           text-align: center;
      //           color: #6b7280; /* text-gray-500 */
      //         }
      //         @media print {
      //           body, .page {
      //             margin: 0;
      //             box-shadow: none;
      //             background: white;
      //           }
      //         }
      //       </style>
      //     </head>
      //     <body>
      //       <div class="page">
      //         <header class="header">
      //           <div class="text-left">
      //             <h1 class="text-3xl font-bold text-gray-800">Certificat d'Identification</h1>
      //             <p class="text-md text-gray-500">Document Officiel</p>
      //           </div>
      //           <div class="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-400">
      //             Logo
      //           </div>
      //         </header>

      //         <main class="content">
      //           <section class="mb-8">
      //             <h2 class="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4 text-gray-700">Informations sur le Propriétaire</h2>
      //             <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
      //               <p><strong>Nom Complet:</strong> ${selectedOwner ? `${selectedOwner.nme} ${selectedOwner.fam_nme}` : "N/A"}</p>
      //               <p><strong>Contact:</strong> ${selectedOwner?.tel || selectedOwner?.email || "N/A"}</p>
      //               <p class="col-span-2"><strong>Adresse:</strong> ${[selectedOwner?.adresse, selectedOwner?.city, selectedOwner?.wilaya, selectedOwner?.code_postal].filter(Boolean).join(", ") || "N/A"}</p>
      //             </div>
      //           </section>

      //           <section class="mb-8">
      //             <h2 class="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4 text-gray-700">Informations sur l'Animal</h2>
      //             <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
      //               <p><strong>Nom:</strong> ${formData.nme || "N/A"}</p>
      //               <p><strong>Espèce:</strong> ${formData.espece || "N/A"}</p>
      //               <p><strong>Race:</strong> ${formData.race || "N/A"}</p>
      //               <p><strong>Sexe:</strong> ${formData.sexe || "N/A"}</p>
      //               <p><strong>Date de Naissance:</strong> ${formData.niss_date ? new Date(formData.niss_date).toLocaleDateString("fr-FR") : "N/A"}</p>
      //               <p><strong>Robe:</strong> ${formData.robe || "N/A"}</p>
      //             </div>
      //           </section>

      //           <section class="mb-8">
      //             <h2 class="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4 text-gray-700">Identification et Sécurité</h2>
      //             <div class="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-4 rounded-lg">
      //               <p><strong>N° Identification:</strong> <span class="font-mono text-base">${formData.num_ident || "N/A"}</span></p>
      //               <p><strong>Mot de passe:</strong> <span class="font-mono text-base">${formData.password || "N/A"}</span></p>
      //             </div>
      //           </section>
      //         </main>

      //         <footer class="footer">
      //           <p>Certificat généré le ${new Date().toLocaleDateString("fr-FR")}.</p>
      //           <p class="mt-2"><strong>Vétérinaire Traitant:</strong> ${user?.email || "Information non disponible"}</p>
      //         </footer>
      //       </div>
      //       <script>
      //         setTimeout(() => { window.print(); window.close(); }, 500);
      //       </script>
      //     </body>
      //   </html>
      // `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-2xl w-full">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <SpeciesIcon species={formData.espece} />
          <h2 className="text-gray-900 text-2xl font-bold">
            {isEditing ? "Modifier l'animal" : "Ajouter un animal"}
          </h2>
        </div>
        {isEditing && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToPreviousAnimal}
              disabled={isSaving || isDeleting || isFirstAnimal}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Précédent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-gray-600 font-medium text-sm tabular-nums">
              {currentIndex} / {ownersAnimalIds.length}
            </span>
            <button
              type="button"
              onClick={goToNextAnimal}
              disabled={isSaving || isDeleting || isLastAnimal}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Suivant"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

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
              className={`block text-sm font-medium ${
                numIdentError ? "text-red-600" : "text-gray-700"
              }`}
            >
              N° Identification
            </label>
            <div className="flex items-center gap-2">
              <input
                id="num_ident"
                name="num_ident"
                value={formData.num_ident || ""}
                onChange={handleChange}
                onBlur={handleNumIdentBlur}
                placeholder="15 caractères alphanumériques"
                className={`p-1 border rounded w-full ${
                  numIdentError ? "border-red-500" : "border-gray-300"
                }`}
                maxLength={15}
              />
              <button
                type="button"
                onClick={() => void generateUniqueId()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded flex-shrink-0"
                title="Générer un numéro unique"
                disabled={isCheckingNumIdent}
              >
                Générer
              </button>
            </div>
            {isCheckingNumIdent && (
              <p className="text-xs text-gray-500 mt-1">Vérification...</p>
            )}
            {numIdentError && (
              <p className="text-xs text-red-600 mt-1">{numIdentError}</p>
            )}
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
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mot de passe
            </label>
            <div className="flex items-center gap-2">
              <input
                id="password"
                name="password"
                type="text"
                value={formData.password || ""}
                onChange={handleChange}
                placeholder="Mot de passe (optionnel)"
                className="p-1 border rounded w-full"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded flex-shrink-0"
                title="Générer un mot de passe"
              >
                Générer
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="propr_id"
              className="block text-sm font-medium text-gray-700"
            >
              * Propriétaire
            </label>
            <div className="flex items-center gap-2" ref={ownerInputRef}>
              <div className="relative w-full">
                <input
                  type="text"
                  id="owner_search"
                  value={ownerSearch}
                  onChange={handleOwnerSearchChange}
                  onFocus={() => setShowOwnerSuggestions(true)}
                  onBlur={handleOwnerBlur}
                  placeholder="Rechercher un propriétaire"
                  className="p-1 border rounded w-full text-gray-900 bg-white"
                  required
                  autoComplete="off"
                />
                {showOwnerSuggestions &&
                  (filteredOwners.length > 0 || ownerSearch) && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                      {filteredOwners.length > 0 ? (
                        filteredOwners.map((owner) => (
                          <li
                            key={owner.id}
                            onClick={() => handleOwnerSelect(owner)}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                          >
                            {owner.nme} {owner.fam_nme}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-gray-500">
                          Aucun propriétaire trouvé
                        </li>
                      )}
                    </ul>
                  )}
              </div>
              <button
                type="button"
                onClick={() => setIsOwnerModalOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-3 rounded flex-shrink-0"
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
              className="p-1 border rounded w-full text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={filteredRaceOptions.length === 0}
            >
              <option value="">
                {filteredRaceOptions.length === 0
                  ? "(Aucune race pour cette espèce)"
                  : "Sélectionner une race"}
              </option>
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
            <div className="flex items-center gap-2">
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
              <button
                type="button"
                onClick={toggleSexe}
                className="flex items-center justify-center h-9 w-9 bg-gray-200 rounded-full hover:bg-gray-300"
                title={`Changer pour ${
                  formData.sexe === "Mâle" ? "Femelle" : "Mâle"
                }`}
              >
                {formData.sexe === "Mâle" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    enable-background="new 0 0 24 24"
                    height="24px"
                    viewBox="0 0 24 24"
                    width="24px"
                    fill="#2854C5"
                  >
                    <rect fill="none" height="24" width="24" />
                    <path d="M9.5,11c1.93,0,3.5,1.57,3.5,3.5S11.43,18,9.5,18S6,16.43,6,14.5S7.57,11,9.5,11z M9.5,9C6.46,9,4,11.46,4,14.5 S6.46,20,9.5,20s5.5-2.46,5.5-5.5c0-1.16-0.36-2.23-0.97-3.12L18,7.42V10h2V4h-6v2h2.58l-3.97,3.97C11.73,9.36,10.66,9,9.5,9z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    enable-background="new 0 0 24 24"
                    height="24px"
                    viewBox="0 0 24 24"
                    width="24px"
                    fill="#BB271A"
                  >
                    <rect fill="none" height="24" width="24" />
                    <path d="M17.5,9.5C17.5,6.46,15.04,4,12,4S6.5,6.46,6.5,9.5c0,2.7,1.94,4.93,4.5,5.4V17H9v2h2v2h2v-2h2v-2h-2v-2.1 C15.56,14.43,17.5,12.2,17.5,9.5z M8.5,9.5C8.5,7.57,10.07,6,12,6s3.5,1.57,3.5,3.5S13.93,13,12,13S8.5,11.43,8.5,9.5z" />
                  </svg>
                )}
              </button>
            </div>
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
                value={(formData.niss_date as string) || ""}
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

        {isEditing && (
          <div className="border-t border-gray-300 pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              QR Code Ministériel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div>
                <label
                  htmlFor="qr_code_status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Statut du QR Code
                </label>
                <select
                  id="qr_code_status"
                  name="qr_code_status"
                  value={formData.qr_code_status || "none"}
                  onChange={handleChange}
                  disabled={
                    role !== "Administrateur" &&
                    formData.qr_code_status === "available"
                  }
                  className="p-1 border rounded w-full text-gray-900 bg-white"
                >
                  <option value="none">Aucun</option>
                  <option value="requested">Demandé</option>
                  {/* Admin can set to available, vet cannot */}
                  <option
                    value="available"
                    disabled={role !== "Administrateur"}
                  >
                    Disponible
                  </option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="qr_code_identifier"
                  className="block text-sm font-medium text-gray-700"
                >
                  Identifiant du QR Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="qr_code_identifier"
                    name="qr_code_identifier"
                    value={formData.qr_code_identifier || ""}
                    onChange={handleChange}
                    placeholder="ID reçu ou à générer"
                    className="p-1 border rounded w-full text-gray-900"
                    readOnly={role !== "Administrateur"}
                  />
                  {role === "Administrateur" && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          qr_code_identifier: crypto.randomUUID(),
                          qr_code_status: "available",
                        }))
                      }
                      className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1 px-3 rounded"
                      title="Générer un nouveau code QR"
                    >
                      Générer
                    </button>
                  )}
                </div>
              </div>
              {/* You can add a QR code display component here */}
              {/* e.g., <QRCode value={formData.qr_code_identifier} /> */}
            </div>
          </div>
        )}

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
              <select
                id="radiat_reason_select"
                name="radiat_reason"
                value={
                  radiationReasons.includes(formData.radiat_reason || "")
                    ? formData.radiat_reason || ""
                    : "Autre"
                }
                onChange={handleChange}
                className="p-1 border rounded w-full text-gray-900"
              >
                <option value="">Sélectionner un motif</option>
                {radiationReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="Autre">Autre...</option>
              </select>
              {!radiationReasons.includes(formData.radiat_reason || "") &&
                formData.is_radiated && (
                  <input
                    type="text"
                    name="radiat_reason"
                    value={formData.radiat_reason || ""}
                    onChange={handleCustomChange}
                    placeholder="Préciser le motif"
                    className="mt-1 p-1 border rounded w-full text-gray-900"
                  />
                )}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-between items-center gap-4 pt-4">
          <div>
            {isEditing && role !== "Vétérinaire" && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400"
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={handleGenerateCertificate}
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                disabled={isSaving || isDeleting}
              >
                Générer Certificat
              </button>
            )}
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-300 rounded hover:bg-gray-400"
              disabled={isSaving || isDeleting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-cyan-300"
              disabled={isSaving || isDeleting}
            >
              {isSaving
                ? "Enregistrement..."
                : isEditing
                  ? "Mettre à jour"
                  : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
      {isOwnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-4">
            <OwnerForm
              onClose={() => setIsOwnerModalOpen(false)}
              onSave={handleNewOwnerSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
}
