import type { FormEvent } from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { getUserByEmail, supabase } from "../../api/supabaseClient";
import type { Animal } from "../animal";
import { useAuth } from "../../hooks/useAuth";
import OwnerForm from "./OwnerForm";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const radiationReasons = ["Décès", "Vente", "Perdu"];

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
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);
  const ownerInputRef = useRef<HTMLDivElement | null>(null);
  const [numIdentError, setNumIdentError] = useState<string | null>(null);
  const [isCheckingNumIdent, setIsCheckingNumIdent] = useState(false);
  const [vetInfo, setVetInfo] = useState<any>(null);
  const [showVetInfo, setShowVetInfo] = useState(false);
  const [isLoadingVetInfo, setIsLoadingVetInfo] = useState(false);

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

  const handleShowVetInfo = async () => {
    if (showVetInfo) {
      setShowVetInfo(false);
      return;
    }

    if (vetInfo) {
      setShowVetInfo(true);
      return;
    }

    const email =
      (formData as any).created_by_email || (animal as any)?.created_by_email;

    if (!email) {
      alert("Information non disponible.");
      return;
    }

    setIsLoadingVetInfo(true);
    try {
      const info = await getUserByEmail(email);
      if (info) {
        setVetInfo(info);
        setShowVetInfo(true);
      } else {
        alert("Vétérinaire introuvable.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la récupération des informations.");
    } finally {
      setIsLoadingVetInfo(false);
    }
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

  const handleGenerateCertificate = async () => {
    if (!animal || !animal.id) {
      alert("Veuillez d'abord enregistrer l'animal.");
      return;
    }
    const veter_infos = await getUserByEmail(
      formData.created_by_email as string
    );
    const selectedOwner = owners.find((o) => o.id === formData.propr_id);
    const certificateHTML = `
    <div id="certificate-to-export" style="position: absolute; left: -9999px; width: 210mm; min-height: 297mm; background: white; padding: 10mm; font-family: Arial, sans-serif; font-size: 10pt; box-sizing: border-box; display: flex; flex-direction: column;">
      <div style="flex-grow: 1;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5mm;">
            <div style="width: 50%; padding-right: 5mm; color: #000;">
                <p style="font-size: 8pt; margin-bottom: 1mm; color: #000;">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
                <p style="font-size: 10pt; font-weight: bold; margin: 0; color: #000;">MINISTÈRE DE L'AGRICULTURE ET DU DÉVELOPPEMENT RURAL</p>
                <p style="font-size: 8pt; margin-top: 2mm; color: #000;">FICHIER NATIONAL D'IDENTIFICATION ET DE TRAÇABILITÉ ANIMALE (FNITA)</p>
            </div>

            <div style="width: 45%; text-align: right; color: #000;">
                <div style="border: 2px solid #0D9488; padding: 1mm 3mm; background-color: #F0FDFA; display: inline-block;">
                    <span style="font-size: 16pt; font-weight: bold; color: #0D9488;">FNITA</span>
                </div>
                <p style="font-size: 8pt; margin-top: 1mm; color: #000;">SOCIÉTÉ D'IDENTIFICATION DES CARNIVORES DOMESTIQUES</p>
                <div style="margin-top: 2mm; background-color: #f0f0f0; padding: 2mm; border: 1px solid #ccc; color: #000;">
                    <strong style="font-size: 12pt;">BARCODE:</strong> <span style="font-family: monospace;">${formData.num_ident || "--"}</span>
                </div>
            </div>
        </div>

        <div style="border: 1px solid #ccc; margin-bottom: 5mm;">
            <div style="background-color: #0D9488; color: black; padding: 2mm 5mm; font-size: 12pt; font-weight: bold; display: flex; align-items: center;">
                DÉTENTEUR
            </div>
            <div style="padding: 3mm 5mm; color: #000;">
                <p style="margin: 1mm 0; color: #000;"><strong>MME/M. ${selectedOwner ? `${selectedOwner.fam_nme || ""} ${selectedOwner.nme || ""}`.trim() : "--"}</strong></p>
                <p style="margin: 1mm 0; color: #000;">${[selectedOwner?.adresse, selectedOwner?.city].filter(Boolean).join(", ") || "Adresse non spécifiée"}</p>
                <p style="margin: 1mm 0; color: #000;"><strong>Wilaya/Province:</strong> ${selectedOwner?.wilaya || "--"} - <strong>CP:</strong> ${selectedOwner?.code_postal || "--"}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 3mm; border-top: 1px dotted #ccc; padding-top: 2mm;">
                    <p style="margin: 1mm 0; color: #000;"><strong>TEL 1:</strong> ${selectedOwner?.tel || "--"}</p>
                    <p style="margin: 1mm 0; color: #000;"><strong>E-MAIL:</strong> ${selectedOwner?.email || "--"}</p>
                </div>
            </div>
        </div>

        <div style="border: 1px solid #ccc; margin-bottom: 5mm;">
            <div style="background-color: #0D9488; color: black; padding: 2mm 5mm; font-size: 12pt; font-weight: bold;">
                IDENTIFICATION DE L'ANIMAL
            </div>
            <div style="padding: 3mm 5mm; color: #000;">
                <div style="background-color: #F0FDFA; padding: 2mm; margin-bottom: 3mm;">
                    <strong style="color: #0D9488;">N° IDENTIFICATION (PUCE):</strong> <span style="font-family: monospace; font-size: 12pt;">${formData.num_ident || "--"}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <div style="width: 48%;">
                        <p style="margin: 1mm 0; color: #000;"><strong>DATE D'INSCREPTION:</strong> ${new Date().toLocaleDateString("fr-FR")}</p>
                        <p style="margin: 1mm 0; color: #000;"><strong>EMPLACEMENT:</strong> --</p>
                        <p style="margin: 1mm 0; color: #000;"><strong>VÉTÉRINAIRE:</strong> ${veter_infos ? `${veter_infos?.fam_nme}${" "}${veter_infos?.nme || `${formData?.created_by_email || "--"}`}` : "--"}</p>
                    </div>
                    <div style="width: 48%;">
                        <p style="margin: 1mm 0; color: #000;"><strong>TATOOAGE:</strong> --</p>
                        <p style="margin: 1mm 0; color: #000;"><strong>DATE:</strong> --</p>
                        <p style="margin: 1mm 0; color: #000;"><strong>MOT DE PASSE:</strong> ${formData.password || "--"}</p>
                    </div>
                </div>
            </div>
        </div>

        <div style="border: 1px solid #ccc; margin-bottom: 5mm;">
            <div style="background-color: #0D9488; color: black; padding: 2mm 5mm; font-size: 12pt; font-weight: bold;">
                DESCRIPTION DE L'ANIMAL
            </div>
            <div style="padding: 3mm 5mm; color: #000;">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>ESPÈCE:</strong> ${formData.espece || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>SEXE:</strong> ${formData.sexe || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>STÉRILISÉ:</strong> --</p>

                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>DATE DE NAISSANCE:</strong> ${formData.niss_date ? new Date(formData.niss_date).toLocaleDateString("fr-FR") : "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>RACE:</strong> ${formData.race || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>PAYS D'ORIGINE:</strong> ALGÉRIE</p>

                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>ROBE:</strong> ${formData.robe || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>NOM D'USAGE:</strong> ${formData.nme || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>CATÉGORIE:</strong> --</p>
                </div>
            </div>
        </div>

        <div style="margin-top: 5mm; font-size: 8pt; color: #555;">
            <p>Ce document atteste de l'enregistrement de l'animal dans le Fichier National d'Identification et de Traçabilité Animale (FNITA).</p>
            <p>Toute modification des informations (changement d'adresse, de détenteur, décès) doit être signalée au FNITA.</p>
        </div>
      </div>

      <div style="border: 2px solid #0f766e; margin-top: 10mm;">
          <div style="background-color: #0f766e; color: black; padding: 2mm 5mm; font-size: 10pt; font-weight: bold; text-align: center;">
              PARTIE BASSE DE LA CARTE D'IDENTIFICATION À DÉTACHER ET À CONSERVER AVEC VOUS
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
              <thead>
                  <tr style="background-color: #f0f0f0;">
                      <th style="border: 1px solid #ccc; padding: 2mm; width: 40%; text-align: left; background-color: #ccfbf1; color: #000;">ANIMAL</th>
                      <th style="border: 1px solid #ccc; padding: 2mm; width: 60%; text-align: left; background-color: #ccfbf1; color: #000;">DÉTENTEUR</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td style="border: 1px solid #ccc; padding: 2mm; vertical-align: top; color: #000;">
                          <strong>IDENTIFICATION:</strong> <span style="font-family: monospace;">${formData.num_ident || "--"}</span><br>
                          <strong>NOM:</strong"> ${formData.nme || "--"}<br>
                          <strong>NÉ(E) LE:</strong> ${formData.niss_date ? new Date(formData.niss_date).toLocaleDateString("fr-FR") : "--"}<br>
                          <strong>RACE:</strong> ${formData.race || "--"}<br>
                          <strong>ROBE:</strong> ${formData.robe || "--"}
                      </td>
                      <td style="border: 1px solid #ccc; padding: 2mm; vertical-align: top; color: #000;">
                          <strong>MME/M. ${selectedOwner ? `${selectedOwner.fam_nme || ""} ${selectedOwner.nme || ""}`.trim() : "--"}</strong><br>
                          ${[selectedOwner?.adresse, selectedOwner?.city].filter(Boolean).join(", ") || "Adresse non spécifiée"}<br>
                          ${selectedOwner?.wilaya || "--"} - <strong>CP:</strong> ${selectedOwner?.code_postal || "--"}<br>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
    </div>
    `;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = certificateHTML;
    document.body.appendChild(tempDiv);

    const certificateElement = document.getElementById("certificate-to-export");
    if (!certificateElement) {
      document.body.removeChild(tempDiv);
      return;
    }

    const canvas = await html2canvas(certificateElement, {
      scale: 3, // Increased scale for better quality
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    let height = pdfWidth / ratio;

    if (height > pdfHeight) {
      height = pdfHeight; // Scale to fit page height if it's too long
    }

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, height);
    pdf.save(`certificat-${formData.num_ident || "animal"}.pdf`);

    document.body.removeChild(tempDiv);
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
              className={`block text-sm font-medium ${numIdentError ? "text-red-600" : "text-gray-700"
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
                className={`p-1 border rounded w-full ${numIdentError ? "border-red-500" : "border-gray-300"
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
                title={`Changer pour ${formData.sexe === "Mâle" ? "Femelle" : "Mâle"
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
          <div className="mt-1">
            <button
              type="button"
              onClick={() => void handleShowVetInfo()}
              className="text-sm text-cyan-600 hover:text-cyan-800 underline focus:outline-none flex items-center gap-2"
            >
              {showVetInfo
                ? "Masquer les infos du vétérinaire"
                : "Voir les infos du vétérinaire"}
              {isLoadingVetInfo && (
                <span className="text-xs text-gray-500">Chargement...</span>
              )}
            </button>

            {showVetInfo && vetInfo && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-800 shadow-sm">
                <p>
                  <span className="font-semibold">Vétérinaire:</span>{" "}
                  {vetInfo.nme} {vetInfo.fam_nme}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {vetInfo.email}
                </p>
                {vetInfo.phone && (
                  <p>
                    <span className="font-semibold">Tél:</span> {vetInfo.phone}
                  </p>
                )}
                {(vetInfo.adresse || vetInfo.city || vetInfo.wilaya) && (
                  <p>
                    <span className="font-semibold">Adresse:</span>{" "}
                    {[vetInfo.adresse, vetInfo.city, vetInfo.wilaya]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

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

        {isEditing && (
          <>
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
          </>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-between items-center gap-4 pt-4">
          <div className="flex items-center gap-2">
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
                onClick={() => void handleGenerateCertificate()}
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
              className="py-2 px-4 bg-red-600  rounded hover:bg-red-800 text-white disabled:bg-gray-300"
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
