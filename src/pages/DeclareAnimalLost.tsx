import { useState, useEffect, useCallback, useRef } from "react";
import PgFooter from "../components/PgFooter";
import { PgHeader2 } from "../components/PgHeader2";
import { supabase } from "../api/supabaseClient";
import type { Animal } from "./animal";

export default function DeclareAnimalLost() {
  const [searchMethod, setSearchMethod] = useState<"qr" | "id">("id");
  const [searchValue, setSearchValue] = useState("");
  const [foundAnimal, setFoundAnimal] = useState<Animal | null>(null);
  const [lostDate, setLostDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Refs to access latest state inside stable callback without re-creating it
  const searchValueRef = useRef(searchValue);
  const searchMethodRef = useRef(searchMethod);

  useEffect(() => {
    searchValueRef.current = searchValue;
  }, [searchValue]);

  useEffect(() => {
    searchMethodRef.current = searchMethod;
  }, [searchMethod]);

  const handleSearch = useCallback(async () => {
    const term = searchValueRef.current;
    const method = searchMethodRef.current;

    if (!term.trim()) return;

    setLoading(true);
    setError(null);
    setFoundAnimal(null);

    try {
      let query = supabase.from("tb_animals").select("*");

      if (method === "qr") {
        query = query.eq("qr_code_identifier", term);
      } else {
        query = query.eq("num_ident", term);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (data) {
        setFoundAnimal(data as Animal);
      } else {
        // Suppress error for short queries to avoid annoyance while typing
        if (term.length > 5) {
           setError("Aucun animal trouvé avec ces informations.");
        }
      }
    } catch (err: any) {
      console.error("Error searching animal:", err);
      setError("Une erreur est survenue lors de la recherche.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect 1: Debounce search on text change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchValue.trim().length >= 3) {
        handleSearch();
      } else {
        // Clear only if text is too short (user cleared input)
        // If user just switched method, this won't fire (dep is searchValue)
        setFoundAnimal(null);
        setError(null);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue, handleSearch]);

  // Effect 2: Immediate search on method change
  useEffect(() => {
    if (searchValue.trim().length >= 3) {
       handleSearch();
    }
  }, [searchMethod, handleSearch]); // Fires immediately on method change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!foundAnimal) {
      setError("Veuillez d'abord identifier l'animal.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error: insertError } = await supabase
        .from("tb_lost_animals")
        .insert({
          created_by_user_id: session?.user?.id || null, 
          lost_date: new Date(lostDate).toISOString(),
          animal_id: foundAnimal.id,
          descr: description,
        });

      if (insertError) throw insertError;

      setSuccess("Déclaration enregistrée avec succès !");
      setFoundAnimal(null);
      setSearchValue("");
      setDescription("");
      setLostDate(new Date().toISOString().split("T")[0]);
    } catch (err: any) {
      console.error("Error submitting declaration:", err);
      setError("Une erreur est survenue lors de l'enregistrement: " + err.message);
    } finally {
      setSubmitting(false);
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

          <div className="mb-8 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Identifier l'animal :
            </h2>
            
            <div className="flex space-x-4 mb-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="mr-1 h-4 w-4 text-teal-600 bg-gray-100 border-gray-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  name="searchMethod"
                  value="id"
                  checked={searchMethod === "id"}
                  onChange={() => setSearchMethod("id")}
                />
                <span className="ml-2 text-gray-800">Numéro d'identification</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="mr-1 h-4 w-4 text-teal-600 bg-gray-100 border-gray-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  name="searchMethod"
                  value="qr"
                  checked={searchMethod === "qr"}
                  onChange={() => setSearchMethod("qr")}
                />
                <span className="ml-2 text-gray-800">QR Code</span>
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  searchMethod === "id"
                    ? "Ex: 250269601234567"
                    : "Scanner ou entrer le code QR"
                }
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              />
               {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {foundAnimal && (
              <div className="mb-8 p-4 bg-green-50 rounded-md border border-green-200">
                 <h2 className="text-lg font-semibold text-green-800 mb-4">
                  Animal trouvé
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                   <div>
                      <span className="font-bold text-gray-700">Nom:</span> {foundAnimal.nme}
                   </div>
                   <div>
                      <span className="font-bold text-gray-700">Espèce:</span> {foundAnimal.espece}
                   </div>
                   <div>
                      <span className="font-bold text-gray-700">Race:</span> {foundAnimal.race || "N/A"}
                   </div>
                   <div>
                      <span className="font-bold text-gray-700">Sexe:</span> {foundAnimal.sexe}
                   </div>
                   <div>
                      <span className="font-bold text-gray-700">ID:</span> {foundAnimal.num_ident || "N/A"}
                   </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label
                  htmlFor="lostDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date de perte
                </label>
                <input
                  type="date"
                  id="lostDate"
                  name="lostDate"
                  value={lostDate}
                  onChange={(e) => setLostDate(e.target.value)}
                  style={{ colorScheme: "light" }}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 cursor-pointer"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description / Circonstances
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                  placeholder="Détails supplémentaires..."
                ></textarea>
              </div>

              {error && (
                <div className="md:col-span-2 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}
              {success && (
                <div className="md:col-span-2 text-green-600 text-sm text-center font-bold">
                  {success}
                </div>
              )}

              <div className="md:col-span-2 text-center">
                <button
                  type="submit"
                  disabled={submitting || !foundAnimal}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? "Enregistrement..." : "Soumettre la déclaration"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
