import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../api/supabaseClient";
import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import type { Animal } from "../animal";
import { Table, type Column } from "../../components/Table";
import AnimalForm from "./AnimalForm"; // Corrected import path

type FilterOptions = {
  espece: string;
  race: string;
  sexe: string;
  propr_id: string;
  is_radiated: "all" | "true" | "false";
};

type Owner = {
  id: string;
  nme: string;
};

export default function AnimalsManage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    espece: "all",
    race: "all",
    sexe: "all",
    propr_id: "all",
    is_radiated: "all",
  });
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Partial<Animal> | null>(
    null
  );
  const [isRadiateModalOpen, setIsRadiateModalOpen] = useState(false);

  const areAllSelectedRadiated = useMemo(() => {
    if (selectedAnimalIds.length === 0) {
      return false;
    }
    const selectedAnimals = animals.filter((animal) =>
      selectedAnimalIds.includes(animal.id)
    );
    if (selectedAnimals.length === 0) {
      return false;
    }
    return selectedAnimals.every((animal) => animal.is_radiated);
  }, [selectedAnimalIds, animals]);

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Utilisateur non authentifié.");
      }

      const { data, error: fetchError } = await supabase
        .from("tb_animals")
        .select(
          `
          *,
          owner:propr_id ( nme )
        `
        )
        .eq("created_by_email", user.email);

      if (fetchError) {
        throw fetchError;
      }

      const processedData = (data || []).map((animal) => ({
        ...animal,
        owner_name: animal.owner ? animal.owner.nme : null,
        created_at: new Date(animal.created_at),
        niss_date: animal.niss_date ? new Date(animal.niss_date) : null,
      }));
      setAnimals(processedData);
    } catch (err: unknown) {
      setError("Impossible de charger les données des animaux.");
      console.error("Error fetching animals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("tb_props")
        .select("id, nme");
      if (fetchError) throw fetchError;
      setOwners(data || []);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
    fetchOwners();
  }, [fetchAnimals, fetchOwners]);

  const especes = useMemo(() => {
    const allEspeces = animals
      .map((animal) => animal.espece)
      .filter((e): e is string => e !== null && e !== "");
    return [...new Set(allEspeces)];
  }, [animals]);

  const races = useMemo(() => {
    const allRaces = animals
      .map((animal) => animal.race)
      .filter((r): r is string => r !== null && r !== "");
    return [...new Set(allRaces)];
  }, [animals]);

  const filteredAnimals = useMemo(() => {
    return animals
      .filter((animal) => {
        const { espece, race, sexe, is_radiated, propr_id } = filters;
        if (espece !== "all" && animal.espece !== espece) return false;
        if (race !== "all" && animal.race !== race) return false;
        if (sexe !== "all" && animal.sexe !== sexe) return false;
        if (is_radiated !== "all") {
          if (is_radiated === "true" && !animal.is_radiated) return false;
          if (is_radiated === "false" && animal.is_radiated) return false;
        }
        if (propr_id !== "all" && animal.propr_id !== propr_id) return false;
        return true;
      })
      .filter(
        (animal) =>
          animal.nme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.num_ident?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.num_passport
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          animal.espece?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.race?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.robe?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [animals, searchTerm, filters]);

  const handleRowSelect = useCallback(
    (id: string | number, isMulti: boolean) => {
      const strId = String(id);
      if (isMulti || isMultiSelectMode) {
        setSelectedAnimalIds((prev) =>
          prev.includes(strId)
            ? prev.filter((i) => i !== strId)
            : [...prev, strId]
        );
      } else {
        setSelectedAnimalIds((prev) =>
          prev.length === 1 && prev[0] === strId ? [] : [strId]
        );
      }
    },
    [isMultiSelectMode]
  );

  const handleAddClick = () => {
    setEditingAnimal(null);
    setIsModalOpen(true);
  };

  const handleEditClick = () => {
    if (selectedAnimalIds.length !== 1) return;
    const animalToEdit = animals.find((a) => a.id === selectedAnimalIds[0]);
    if (animalToEdit) {
      setEditingAnimal(animalToEdit);
      setIsModalOpen(true);
    }
  };

  const handleRowDoubleClick = useCallback(
    (id: string | number) => {
      const animalToEdit = animals.find((a) => a.id === String(id));
      if (animalToEdit) {
        setEditingAnimal(animalToEdit);
        setIsModalOpen(true);
      }
    },
    [animals]
  );
  const handleSelectAll = useCallback(
    (areAllSelected: boolean) => {
      setSelectedAnimalIds(
        areAllSelected ? filteredAnimals.map((a) => a.id) : []
      );
    },
    [filteredAnimals]
  );

  const columns: Column<Animal>[] = useMemo(
    () => [
      {
        header: "Nom",
        accessor: "nme",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "N° Identification",
        accessor: "num_ident",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Propriétaire",
        accessor: "owner_name",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Espèce",
        accessor: "espece",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Race",
        accessor: "race",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Sexe",
        accessor: "sexe",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Date de Naissance",
        accessor: "niss_date",
        sortable: true,
        cellStyle: { color: "rgb(17 24 39)" },
        render: (animal) =>
          animal.niss_date && !isNaN(animal.niss_date.getTime())
            ? animal.niss_date.toLocaleDateString("fr-FR")
            : "N/A",
      },
      {
        header: "Robe",
        accessor: "robe",
        cellStyle: { color: "rgb(17 24 39)" },
      },
      {
        header: "Radié",
        accessor: "is_radiated",
        sortable: true,
        render: (animal) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              animal.is_radiated
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {animal.is_radiated ? "Oui" : "Non"}
          </span>
        ),
      },
    ],
    []
  );

  const handleDeleteClick = useCallback(async () => {
    if (selectedAnimalIds.length === 0) return;

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedAnimalIds.length} animal (animaux) ? Cette action est irréversible.`
    );

    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from("tb_animals")
          .delete()
          .in("id", selectedAnimalIds);

        if (error) throw error;

        setSelectedAnimalIds([]); // Clear selection
        fetchAnimals(); // Refresh data
      } catch (err: any) {
        setError(`Erreur lors de la suppression: ${err.message}`);
      }
    }
  }, [selectedAnimalIds, fetchAnimals]);

  const handleBulkRadiate = async ({
    date,
    reason,
  }: {
    date: string;
    reason: string;
  }) => {
    if (selectedAnimalIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("tb_animals")
        .update({
          is_radiated: true,
          radiat_date: date,
          radiat_reason: reason,
        })
        .in("id", selectedAnimalIds);

      if (error) throw error;

      setSelectedAnimalIds([]); // Clear selection
      fetchAnimals(); // Refresh data
    } catch (err: any) {
      setError(`Erreur lors de la radiation: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <PgHeader2 />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Gestion des Animaux
          </h1>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={handleAddClick}
                className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Ajouter un Animal
              </button>
              <button
                onClick={handleEditClick}
                disabled={
                  selectedAnimalIds.length !== 1 || filteredAnimals.length === 0
                }
                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
                  />
                </svg>
                Modifier
              </button>
              <button
                onClick={() => setIsRadiateModalOpen(true)}
                disabled={
                  selectedAnimalIds.length === 0 ||
                  filteredAnimals.length === 0 ||
                  areAllSelectedRadiated
                }
                className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Radier
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={
                  selectedAnimalIds.length === 0 || filteredAnimals.length === 0
                }
                className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Supprimer
              </button>
            </div>
            <button
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              className={`flex items-center justify-center font-semibold py-2 px-5 rounded-full transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed ${
                isMultiSelectMode
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800"
              }`}
              disabled={filteredAnimals.length === 0}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Sélection Multiple
            </button>
          </div>

          <div className="mb-6 flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Rechercher..."
              className="flex-grow text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filters.propr_id}
              onChange={(e) =>
                setFilters({ ...filters, propr_id: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Tous les Propriétaires</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.nme}
                </option>
              ))}
            </select>
            <select
              value={filters.espece}
              onChange={(e) =>
                setFilters({ ...filters, espece: e.target.value })
              }
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Toutes les espèces</option>
              {especes.map((espece) => (
                <option key={espece} value={espece}>
                  {espece}
                </option>
              ))}
            </select>
            <select
              value={filters.race}
              onChange={(e) => setFilters({ ...filters, race: e.target.value })}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Toutes les races</option>
              {races.map((race) => (
                <option key={race} value={race}>
                  {race}
                </option>
              ))}
            </select>
            <select
              value={filters.sexe}
              onChange={(e) => setFilters({ ...filters, sexe: e.target.value })}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Tous les sexes</option>
              <option value="Mâle">Mâle</option>
              <option value="Femelle">Femelle</option>
            </select>
            <select
              value={filters.is_radiated}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  is_radiated: e.target.value as "all" | "true" | "false",
                })
              }
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
            >
              <option value="all">Radié (Tous)</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>

          <Table
            columns={columns}
            data={filteredAnimals}
            isLoading={loading}
            error={error}
            emptyStateMessage="Aucun animal trouvé."
            initialSortColumn="created_at"
            selectedItemIds={selectedAnimalIds}
            onRowSelect={handleRowSelect}
            isMultiSelect={isMultiSelectMode}
            onRowDoubleClick={handleRowDoubleClick}
            onSelectAll={handleSelectAll}
          />
        </div>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-4">
            <AnimalForm
              animal={editingAnimal}
              owners={owners}
              animals={animals}
              onOwnerAdded={fetchOwners}
              onClose={() => setIsModalOpen(false)}
              onSave={() => {
                setIsModalOpen(false);
                fetchAnimals(); // Refresh data after saving
              }}
              onAnimalChange={(animal) => {
                setEditingAnimal(animal);
                setIsModalOpen(true);
              }}
            />
          </div>
        )}
        {isRadiateModalOpen && (
          <RadiateForm
            count={selectedAnimalIds.length}
            onClose={() => setIsRadiateModalOpen(false)}
            onSave={handleBulkRadiate}
          />
        )}
      </main>
      <PgFooter />
    </div>
  );
}

const radiationReasons = [
  "Décès",
  "Vente",
  "Perdu",
  "Retrouvé par propriétaire",
];

const RadiateForm = ({
  count,
  onClose,
  onSave,
}: {
  count: number;
  onClose: () => void;
  onSave: (data: { date: string; reason: string }) => Promise<void>;
}) => {
  const [reason, setReason] = useState(radiationReasons[0]);
  const [customReason, setCustomReason] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const finalReason = reason === "Autre" ? customReason : reason;
    if (!finalReason) {
      // Basic validation
      alert("Veuillez préciser un motif.");
      setIsSaving(false);
      return;
    }
    await onSave({
      date,
      reason: finalReason,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Radier {count} animal (animaux)
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="radiate_date"
              className="block text-sm font-medium text-gray-700"
            >
              Date de radiation
            </label>
            <input
              id="radiate_date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 p-2 border rounded w-full text-gray-900"
              required
            />
          </div>
          <div>
            <label
              htmlFor="radiate_reason"
              className="block text-sm font-medium text-gray-700"
            >
              Motif de radiation
            </label>
            <select
              id="radiate_reason_select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 p-2 border rounded w-full text-gray-900"
              required
            >
              {radiationReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Autre">Autre...</option>
            </select>
            {reason === "Autre" && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Préciser le motif"
                className="mt-2 p-2 border rounded w-full text-gray-900"
                required
              />
            )}
          </div>
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
              className="py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-yellow-300"
              disabled={isSaving}
            >
              {isSaving ? "Enregistrement..." : "Confirmer la Radiation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
