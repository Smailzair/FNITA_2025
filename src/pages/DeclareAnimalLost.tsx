import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import PgFooter from "../components/PgFooter";
import { PgHeader2 } from "../components/PgHeader2";
import { supabase } from "../api/supabaseClient";
import type { Animal } from "./animal";

type AnimalFormData = Partial<Animal>;

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

export default function DeclareAnimalLost() {
  const [identifier, setIdentifier] = useState("");
  const [foundAnimal, setFoundAnimal] = useState<AnimalFormData | null>(null);
  const [lostDate, setLostDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [myDeclarations, setMyDeclarations] = useState<any[]>([]);
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "found" | "not_found"
  >("all");
  const [existingDeclaration, setExistingDeclaration] = useState<any | null>(
    null
  );

  useEffect(() => {
    if (foundAnimal) {
      dateInputRef.current?.focus();
    }
  }, [foundAnimal]);

  useEffect(() => {
    void fetchDeclarations();
  }, []);

  const fetchDeclarations = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      // 1. Fetch declarations first (without join)
      const { data: declarations, error: declError } = await supabase
        .from("tb_lost_animals")
        .select("*")
        .eq("created_by_user_id", userData.user.id)
        .order("lost_date", { ascending: false });

      if (declError || !declarations) return;

      // 2. Collect animal IDs
      const animalIds = declarations
        .map((d) => d.animal_id)
        .filter((id) => id); // Filter out nulls

      // 3. Fetch animal details manually
      let animalsMap: Record<string, any> = {};
      if (animalIds.length > 0) {
        const { data: animals } = await supabase
          .from("tb_animals")
          .select("id, nme, espece, sexe, num_ident, qr_code_identifier")
          .in("id", animalIds);

        animals?.forEach((a) => (animalsMap[a.id] = a));
      }

      // 4. Merge data
      const mergedData = declarations.map((d) => ({
        ...d,
        animal: animalsMap[d.animal_id] || null,
      }));

      setMyDeclarations(mergedData);
    }
  };

  const handleSearch = async (e: FormEvent | KeyboardEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError("Veuillez entrer un identifiant à rechercher.");
      return;
    }
    setIsSearching(true);
    setError(null);
    setFoundAnimal(null);
    setExistingDeclaration(null);

    try {
      const { data, error: dbError } = await supabase
        .from("tb_animals")
        .select("*, owner:propr_id ( fam_nme, nme )")
        .or(`num_ident.eq.${identifier},qr_code_identifier.eq.${identifier}`)
        .limit(1)
        .single(); // Use single to get one object or null

      if (dbError && dbError.code !== "PGRST116") {
        // PGRST116: "exact one row expected, but 0 rows found" - this is not an error for us.
        throw dbError;
      }

      if (data) {
        setFoundAnimal(data);

        // Check for existing active lost declaration
        const { data: lostData } = await supabase
          .from("tb_lost_animals")
          .select("*")
          .eq("animal_id", data.id)
          .eq("is_found", false)
          .limit(1);

        if (lostData && lostData.length > 0) {
          setExistingDeclaration(lostData[0]);
        }
      } else {
        setError("Aucun animal trouvé avec cet identifiant.");
      }
    } catch (err: any) {
      setError(`Erreur lors de la recherche: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!foundAnimal?.id) {
      alert("Veuillez d'abord rechercher et trouver un animal.");
      return;
    }

    // If animal is already radiated, show a confirmation dialog
    if (foundAnimal.is_radiated === true) {
      const proceed = window.confirm(
        `Attention : Cet animal est déjà radié ! (comme '"${foundAnimal.radiat_reason}"'). Voulez-vous continuer ?`
      );
      if (!proceed) {
        return;
      }
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from("tb_lost_animals")
      .insert({
        created_by_user_id: userData.user?.id,
        lost_date: lostDate,
        animal_id: foundAnimal.id,
        descr: description,
      });
    if (insertError) {
      alert(`Erreur lors de l'insertion: ${insertError.message}`);
    } else {
      alert("La déclaration de perte a été enregistrée avec succès !");
      // Reset form
      setIdentifier("");
      setFoundAnimal(null);
      setExistingDeclaration(null);
      setLostDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setError(null);
      void fetchDeclarations();
    }
  };

  const filteredDeclarations = myDeclarations.filter((decl) => {
    const search = filterText.toLowerCase();
    const animalName = decl.animal?.nme?.toLowerCase() || "";
    const animalIdent = decl.animal?.num_ident?.toLowerCase() || "";
    const animalSpecies = decl.animal?.espece?.toLowerCase() || "";
    const animalQr = decl.animal?.qr_code_identifier?.toLowerCase() || "";

    const matchesText =
      animalName.includes(search) ||
      animalIdent.includes(search) ||
      animalSpecies.includes(search) ||
      animalQr.includes(search);

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "found"
        ? decl.is_found
        : !decl.is_found;

    return matchesText && matchesStatus;
  });

  const getAnimalIcon = (species: string | undefined) => {
    const imageName =
      species && speciesImageFiles[species] ? speciesImageFiles[species] : null;

    if (!imageName) {
      return null;
    }

    return (
      <img
        src={`/Anims/${imageName}`}
        alt={species || "Animal"}
        className="w-8 h-8 object-contain"
      />
    );
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Déclarer un animal perdu
          </h1>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {/* Animal Search Section */}
            <div className="p-4 border rounded-md">
              <label
                htmlFor="animal-id"
                className="block text-sm font-medium text-gray-700"
              >
                QR Code ou Numéro d'identification de l'animal
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  id="animal-id"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setFoundAnimal(null);
                    setExistingDeclaration(null);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSearch(e);
                    }
                  }}
                  className="flex-1 block w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Entrez l'identifiant"
                />
                <button
                  type="button"
                  onClick={(e) => void handleSearch(e)}
                  disabled={isSearching}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                  {isSearching ? "Recherche..." : "Rechercher"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            {/* Found Animal Info Section (Read-only) */}
            {foundAnimal && (
              <div className="p-4 border rounded-md bg-gray-100 space-y-2">
                <h2 className="text-lg font-semibold text-gray-800">
                  Informations sur l'animal
                </h2>
                <p className="text-gray-900">
                  <span className="font-medium">Nom:</span> {foundAnimal.nme}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">Espèce:</span>{" "}
                  {foundAnimal.espece}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">Race:</span> {foundAnimal.race}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">N° Ident.:</span>{" "}
                  {foundAnimal.num_ident}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">Sexe:</span> {foundAnimal.sexe}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">Date de naissance:</span>{" "}
                  {foundAnimal.niss_date
                    ? new Date(foundAnimal.niss_date).toLocaleDateString()
                    : "Non renseignée"}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">Propriétaire:</span>{" "}
                  {foundAnimal.owner
                    ? `${foundAnimal.owner.fam_nme} ${foundAnimal.owner.nme}`
                    : "Non renseigné"}
                </p>
                {foundAnimal.is_radiated && (
                  <div className="mt-4 bg-orange-100 border-l-4 border-orange-500 p-4 rounded shadow-sm">
                    <h4 className="font-bold text-orange-900">
                      Ce animal est radié !
                    </h4>
                    <div className="mt-2 text-sm text-orange-800">
                      <p>
                        <span className="font-semibold">Date :</span>{" "}
                        {foundAnimal.radiat_date
                          ? new Date(
                              foundAnimal.radiat_date
                            ).toLocaleDateString("fr-FR")
                          : "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Motif :</span>{" "}
                        {foundAnimal.radiat_reason || "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Existing Declaration Warning */}
            {foundAnimal && existingDeclaration && (
              <div className="p-4 border rounded-md bg-yellow-50 border-yellow-200 text-yellow-800 mt-4">
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                  <h3 className="font-bold text-lg">
                    Cet animal est déjà déclaré perdu
                  </h3>
                </div>
                <p className="mt-2 ml-8">
                  Une déclaration est déjà active pour cet animal depuis le{" "}
                  <span className="font-semibold">
                    {new Date(existingDeclaration.lost_date).toLocaleDateString()}
                  </span>
                  .
                </p>
              </div>
            )}

            {/* Additional Fields */}
            {foundAnimal && !existingDeclaration && (
              <>
                <div>
                  <label
                    htmlFor="lost-date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Date de la perte
                  </label>
                  <input
                    type="date"
                    ref={dateInputRef}
                    id="lost-date"
                    value={lostDate}
                    onChange={(e) => setLostDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    required
                    className="mt-1 block w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description / Circonstances
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Décrivez les circonstances de la perte..."
                  />
                </div>

                {/* Save Button */}
                <div className="text-center">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Enregistrer la déclaration
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* My Declarations Table */}
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Mes déclarations
          </h2>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Rechercher (nom, espèce, identifiant, QR)..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
            />
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "found" | "not_found")
              }
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
            >
              <option value="all">Tous</option>
              <option value="found">Trouvé</option>
              <option value="not_found">Non trouvé</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Animal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trouvé
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeclarations.length > 0 ? (
                  filteredDeclarations.map((decl) => (
                    <tr key={decl.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(decl.lost_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="mr-4">
                            {getAnimalIcon(decl.animal?.espece)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {decl.animal?.nme || "Inconnu"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {decl.animal?.espece}{" "}
                              {decl.animal?.sexe ? `- ${decl.animal.sexe}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {decl.is_found ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Oui
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Non
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Aucune déclaration trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
