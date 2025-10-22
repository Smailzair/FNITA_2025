import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../api/supabaseClient";
import { PgHeader2 } from "../components/PgHeader2";
import PgFooter from "../components/PgFooter";

// Define the type for a veterinarian based on your tb_login table
type Veterinarian = {
  id: string;
  fam_nme: string;
  nme: string;
  email: string;
  phone: string;
  validated: boolean;
  wilaya: string;
  city: string;
};

type FilterStatus = "all" | "validated" | "not_validated";

export default function ManageVets() {
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const fetchVets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("tb_login")
        .select("id, fam_nme, nme, email, phone, validated, wilaya, city")
        .eq("type", "Vétérinaire");

      if (fetchError) {
        throw fetchError;
      }

      setVets(data || []);
    } catch (err: any) {
      setError("Impossible de charger les données des vétérinaires.");
      console.error("Error fetching veterinarians:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVets();
  }, [fetchVets]);

  const handleValidationToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from("tb_login")
        .update({ validated: !currentStatus })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      // Update local state to reflect the change immediately
      setVets((prevVets) =>
        prevVets.map((vet) =>
          vet.id === id ? { ...vet, validated: !currentStatus } : vet
        )
      );
    } catch (err: any) {
      alert("Erreur lors de la mise à jour du statut.");
      console.error("Error updating validation status:", err);
    }
  };

  const filteredVets = useMemo(() => {
    return vets
      .filter((vet) => {
        if (filterStatus === "validated") return vet.validated;
        if (filterStatus === "not_validated") return !vet.validated;
        return true;
      })
      .filter(
        (vet) =>
          `${vet.fam_nme} ${vet.nme}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          vet.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [vets, searchTerm, filterStatus]);

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Gestion des Vétérinaires
          </h1>

          {/* Controls: Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <option value="all">Tous</option>
              <option value="validated">Validés</option>
              <option value="not_validated">Non Validés</option>
            </select>
          </div>

          {/* Data View */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email & Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valider
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        Chargement...
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-red-500">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && filteredVets.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        Aucun vétérinaire trouvé.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    filteredVets.map((vet) => (
                      <tr key={vet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vet.fam_nme} {vet.nme}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vet.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vet.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vet.city}, {vet.wilaya}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vet.validated
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vet.validated ? "Validé" : "Non validé"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label
                            htmlFor={`toggle-${vet.id}`}
                            className="flex items-center justify-center cursor-pointer"
                          >
                            <div className="relative">
                              <input
                                type="checkbox"
                                id={`toggle-${vet.id}`}
                                className="sr-only"
                                checked={vet.validated}
                                onChange={() =>
                                  handleValidationToggle(vet.id, vet.validated)
                                }
                              />
                              <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                              <div
                                className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                                  vet.validated ? "translate-x-6" : ""
                                }`}
                              ></div>
                            </div>
                          </label>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <PgFooter />
    </div>
  );
}
