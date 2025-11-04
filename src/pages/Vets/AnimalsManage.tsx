import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../api/supabaseClient";
import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import { Table, type Column } from "../../components/Table";
import AnimalForm from "./AnimalForm"; // Corrected import path

type Animal = {
  id: string;
  created_at: Date;
  nme: string | null;
  num_ident: string | null;
  num_passport: string | null;
  propr_id: string | null; // This will need to be joined to get owner info
  espece: string | null;
  race: string | null;
  sexe: string | null;
  niss_date: Date | null;
  descr: string | null;
  robe: string | null;
  is_radiated: boolean | null;
  owner_name?: string | null;
};

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
          animal.niss_date
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <AnimalForm
              animal={editingAnimal}
              owners={owners}
              onOwnerAdded={fetchOwners}
              onClose={() => setIsModalOpen(false)}
              onSave={() => {
                setIsModalOpen(false);
                fetchAnimals(); // Refresh data after saving
              }}
            />
          </div>
        )}
      </main>
      <PgFooter />
    </div>
  );
}
