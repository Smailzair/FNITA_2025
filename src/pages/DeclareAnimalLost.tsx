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

export default function DeclareAnimalLost() {
  const [identifier, setIdentifier] = useState("");
  const [foundAnimal, setFoundAnimal] = useState<AnimalFormData | null>(null);
  const [lostDate, setLostDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (foundAnimal) {
      dateInputRef.current?.focus();
    }
  }, [foundAnimal]);

  const handleSearch = async (e: FormEvent | KeyboardEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError("Veuillez entrer un identifiant à rechercher.");
      return;
    }
    setIsSearching(true);
    setError(null);
    setFoundAnimal(null);

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
        `Attention : Cet animal est déjà marqué comme "${foundAnimal.radiat_reason}". Déclarer un animal décédé comme "Perdu" écrasera son statut actuel. Voulez-vous continuer ?`
      );
      if (!proceed) {
        return;
      }
    }

    // Form submission logic to update the animal status
    const { error: updateError } = await supabase
      .from("tb_animals")
      .update({
        is_radiated: true,
        radiat_reason: "Perdu",
        radiat_date: lostDate,
      })
      .eq("id", foundAnimal.id);

    if (updateError) {
      alert(`Erreur lors de la mise à jour: ${updateError.message}`);
    } else {
      alert("La déclaration de perte a été enregistrée avec succès !");
      // Reset form
      setIdentifier("");
      setFoundAnimal(null);
      setLostDate(new Date().toISOString().split("T")[0]);
      setError(null);
    }
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
                  onChange={(e) => setIdentifier(e.target.value)}
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
              </div>
            )}

            {/* Additional Fields */}
            {foundAnimal && (
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
      </main>
      <PgFooter />
    </div>
  );
}
